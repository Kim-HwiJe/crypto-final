// src/app/api/file/upload/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import clientPromise from '@/lib/mongodb'
import { v4 as uuidv4 } from 'uuid'
import { Readable } from 'stream'
import { GridFSBucket, ObjectId } from 'mongodb'
import { hash as bcryptHash } from 'bcryptjs'
import crypto from 'crypto'
import path from 'path'
import fs from 'fs'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  // 0) 로그인 확인
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json(
      { message: '로그인이 필요합니다.' },
      { status: 401 }
    )
  }
  const {
    email: ownerEmail,
    name: ownerName,
    image: ownerAvatar,
  } = session.user

  // 1) formData
  const formData = await request.formData()

  // ——————————————————————
  // “청크 업로드 모드”인지 구분
  const chunkBlob = formData.get('chunk') as Blob | null
  if (chunkBlob) {
    // → 청크 모드: filename, chunkIndex, totalChunks 로 처리
    const filename = formData.get('filename')?.toString() || ''
    const chunkIndex = parseInt(
      formData.get('chunkIndex')?.toString() || '0',
      10
    )
    const totalChunks = parseInt(
      formData.get('totalChunks')?.toString() || '0',
      10
    )
    // ① plainLength 받아오기
    const plainLengthRaw = formData.get('plainLength')?.toString()
    const plainLength = plainLengthRaw ? parseInt(plainLengthRaw, 10) : null

    if (!filename || isNaN(chunkIndex) || isNaN(totalChunks)) {
      return NextResponse.json(
        { message: '청크 정보(파일명/인덱스/총개수)가 올바르지 않습니다.' },
        { status: 400 }
      )
    }
    if (plainLength == null || isNaN(plainLength)) {
      return NextResponse.json(
        { message: 'plainLength가 필요합니다.' },
        { status: 400 }
      )
    }

    // **Vercel 환경용 임시 폴더** → /tmp/tmp-chunks
    const tempDir = '/tmp/tmp-chunks'
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true })
    }

    // 각 청크를 디스크에 저장
    const tempFilePath = path.join(tempDir, `${filename}.chunk-${chunkIndex}`)
    // Blob → Buffer로 변환 후 저장
    fs.writeFileSync(tempFilePath, Buffer.from(await chunkBlob.arrayBuffer()))

    // 지금까지 저장된 청크 파일 목록 추출
    const uploadedChunks = fs
      .readdirSync(tempDir)
      .filter((f) => f.startsWith(`${filename}.chunk-`))

    // 아직 청크가 모두 모이지 않으면 “청크 업로드 완료”만 응답
    if (uploadedChunks.length < totalChunks) {
      return NextResponse.json({ message: '청크 업로드 완료' })
    }

    // ——————————————————————
    // *모든 청크가 모였을 때 한 번만 실행되는 구간*
    // 2) 청크 파일들을 인덱스 순서대로 정렬
    const sortedChunks = uploadedChunks
      .map((name) => {
        const idx = parseInt(name.split('.chunk-')[1], 10)
        return { name, idx }
      })
      .sort((a, b) => a.idx - b.idx)
      .map((obj) => obj.name)

    // 3) 디스크에 있는 청크들을 합쳐서 하나의 Buffer 생성
    const fullFileBuffer = Buffer.concat(
      sortedChunks.map((chunkFileName) =>
        fs.readFileSync(path.join(tempDir, chunkFileName))
      )
    )

    // ——————————————————————
    // 이하 “원래 단일 업로드 로직” 그대로 처리
    // (암호화 → GridFS 업로드 → 메타 저장 → 임시 청크 파일 삭제)
    const originalName = filename
    const title = formData.get('title')?.toString() || ''
    const description = formData.get('description')?.toString() || ''
    const category = formData.get('category')?.toString() || ''
    const isEncrypted = formData.get('isEncrypted') === 'true'
    const rawAlgo = formData.get('algorithm')?.toString() || ''
    const algorithm = rawAlgo.toLowerCase()
    const rawLockPwd = formData.get('lockPassword')?.toString() || ''
    const expiresRaw = formData.get('expiresAt')?.toString()
    let expiresAt: Date | null = null
    if (expiresRaw) {
      expiresAt = new Date(expiresRaw)
      if (expiresAt <= new Date()) {
        return NextResponse.json(
          { message: '만료일은 오늘 이후여야 합니다.' },
          { status: 400 }
        )
      }
    }

    let buffer = fullFileBuffer
    let encryptionMeta: Record<string, string> = {}
    if (isEncrypted) {
      const key = crypto.randomBytes(32)
      let iv: Buffer, cipher: crypto.Cipher

      if (algorithm === 'chacha20-poly1305') {
        iv = crypto.randomBytes(12)
        cipher = crypto.createCipheriv('chacha20-poly1305', key, iv, {
          authTagLength: 16,
        })
      } else if (algorithm === 'aes-256-gcm') {
        iv = crypto.randomBytes(16)
        cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
      } else if (algorithm === 'aes-256-cbc') {
        iv = crypto.randomBytes(16)
        cipher = crypto.createCipheriv('aes-256-cbc', key, iv)
      } else {
        return NextResponse.json(
          { message: '지원하지 않는 알고리즘입니다.' },
          { status: 400 }
        )
      }

      const encrypted = Buffer.concat([
        cipher.update(fullFileBuffer),
        cipher.final(),
      ])
      let authTag = ''
      if (['aes-256-gcm', 'chacha20-poly1305'].includes(algorithm)) {
        authTag = (cipher as any).getAuthTag().toString('hex')
      }

      buffer = encrypted
      encryptionMeta = {
        algorithm: rawAlgo,
        iv: iv.toString('hex'),
        key: key.toString('hex'),
        authTag,
      }
    }

    // 5) GridFS 업로드
    const client = await clientPromise
    const db = client.db()
    const bucket = new GridFSBucket(db, { bucketName: 'uploads' })

    const ext = path.extname(originalName)
    const filenameGridFS = `${uuidv4()}${ext}`

    const readStream = Readable.from(buffer)
    const uploadStream = bucket.openUploadStream(filenameGridFS, {
      metadata: {
        originalName,
        title,
        description,
        category,
        isEncrypted,
        encryptionMeta,
        expiresAt,
        ownerEmail,
        ownerName,
        ownerAvatar,
        plainLength, // plainLength를 GridFS metadata에도 저장
      },
    })

    await new Promise<void>((res, rej) =>
      readStream.pipe(uploadStream).on('error', rej).on('finish', res)
    )
    const fileId = uploadStream.id as ObjectId

    let hashedLockPassword: string | undefined
    if (isEncrypted) {
      hashedLockPassword = await bcryptHash(rawLockPwd, 10)
    }

    // 7) 메타 저장 (files 컬렉션)
    await db.collection('files').insertOne({
      _id: fileId,
      title,
      description,
      filename: filenameGridFS,
      originalName,
      category,
      isEncrypted,
      algorithm: isEncrypted ? rawAlgo : null,
      lockPassword: hashedLockPassword,
      createdAt: new Date(),
      ownerEmail,
      ownerName,
      ownerAvatar,
      expiresAt,
      views: 0,
      plainLength, // files 컬렉션에 plainLength 저장
    })

    // 8) 임시 청크 파일 삭제
    sortedChunks.forEach((chunkFileName) =>
      fs.unlinkSync(path.join(tempDir, chunkFileName))
    )

    return NextResponse.json({ id: fileId.toString() })
  }

  // ——————————————————————
  // “단일 업로드 모드” (chunk 필드가 없는 경우)
  // 2) formData에서 file Blob 가져오기
  const title = formData.get('title')?.toString() || ''
  const description = formData.get('description')?.toString() || ''
  const fileBlob = formData.get('file') as Blob | null
  const category = formData.get('category')?.toString() || ''
  if (!fileBlob) {
    return NextResponse.json({ message: '파일이 필요합니다.' }, { status: 400 })
  }

  // ② plainLength 받아오기
  const plainLengthRawSingle = formData.get('plainLength')?.toString()
  const plainLengthSingle = plainLengthRawSingle
    ? parseInt(plainLengthRawSingle, 10)
    : null
  if (plainLengthSingle == null || isNaN(plainLengthSingle)) {
    return NextResponse.json(
      { message: 'plainLength가 필요합니다.' },
      { status: 400 }
    )
  }

  // 원본명
  const originalName = (fileBlob as any).name

  // 암호화 모드
  const isEncrypted = formData.get('isEncrypted') === 'true'
  const rawAlgo = formData.get('algorithm')?.toString() || ''
  const algorithm = rawAlgo.toLowerCase()

  // 복호화 비밀번호
  const rawLockPwd = formData.get('lockPassword')?.toString() || ''

  // 만료일
  const expiresRaw = formData.get('expiresAt')?.toString()
  let expiresAt: Date | null = null
  if (expiresRaw) {
    expiresAt = new Date(expiresRaw)
    if (expiresAt <= new Date()) {
      return NextResponse.json(
        { message: '만료일은 오늘 이후여야 합니다.' },
        { status: 400 }
      )
    }
  }

  // 3) 파일 버퍼 (원본 Blob → Buffer)
  const origBuffer = Buffer.from(await fileBlob.arrayBuffer())

  // 4) 암호화 (원래 로직과 동일)
  let buffer = origBuffer
  let encryptionMeta: Record<string, string> = {}
  if (isEncrypted) {
    const key = crypto.randomBytes(32)
    let iv: Buffer, cipher: crypto.Cipher

    if (algorithm === 'chacha20-poly1305') {
      iv = crypto.randomBytes(12)
      cipher = crypto.createCipheriv('chacha20-poly1305', key, iv, {
        authTagLength: 16,
      })
    } else if (algorithm === 'aes-256-gcm') {
      iv = crypto.randomBytes(16)
      cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
    } else if (algorithm === 'aes-256-cbc') {
      iv = crypto.randomBytes(16)
      cipher = crypto.createCipheriv('aes-256-cbc', key, iv)
    } else {
      return NextResponse.json(
        { message: '지원하지 않는 알고리즘입니다.' },
        { status: 400 }
      )
    }

    const encrypted = Buffer.concat([cipher.update(origBuffer), cipher.final()])
    let authTag = ''
    if (['aes-256-gcm', 'chacha20-poly1305'].includes(algorithm)) {
      authTag = (cipher as any).getAuthTag().toString('hex')
    }

    buffer = encrypted
    encryptionMeta = {
      algorithm: rawAlgo,
      iv: iv.toString('hex'),
      key: key.toString('hex'),
      authTag,
    }
  }

  // 5) GridFS 업로드 (원래 로직과 동일)
  const client = await clientPromise
  const db = client.db()
  const bucket = new GridFSBucket(db, { bucketName: 'uploads' })

  const ext = path.extname(originalName)
  const filenameGridFS = `${uuidv4()}${ext}`

  const readStream = Readable.from(buffer)
  const uploadStream = bucket.openUploadStream(filenameGridFS, {
    metadata: {
      originalName,
      title,
      description,
      category,
      isEncrypted,
      encryptionMeta,
      expiresAt,
      ownerEmail,
      ownerName,
      ownerAvatar,
      plainLength: plainLengthSingle, // GridFS metadata에도 plainLength 추가
    },
  })

  await new Promise<void>((res, rej) =>
    readStream.pipe(uploadStream).on('error', rej).on('finish', res)
  )
  const fileId = uploadStream.id as ObjectId

  // 6) 암호문 접근용 비밀번호 해시
  let hashedLockPassword: string | undefined
  if (isEncrypted) {
    hashedLockPassword = await bcryptHash(rawLockPwd, 10)
  }

  // 7) 메타 저장
  await db.collection('files').insertOne({
    _id: fileId,
    title,
    description,
    filename: filenameGridFS,
    originalName,
    category,
    isEncrypted,
    algorithm: isEncrypted ? rawAlgo : null,
    lockPassword: hashedLockPassword,
    createdAt: new Date(),
    ownerEmail,
    ownerName,
    ownerAvatar,
    expiresAt,
    views: 0,
    plainLength: plainLengthSingle, // files 컬렉션에 plainLength 저장
  })

  return NextResponse.json({ id: fileId.toString() })
}
