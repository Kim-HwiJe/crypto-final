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
  // 0) 로그인 확인 (기존 로직 그대로)
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
  // *1) 우선 “청크 업로드 모드”인지 확인 *
  // 청크 업로드 모드인 경우, formData에 chunk, filename, chunkIndex, totalChunks 필드가 있음
  const chunkBlob = formData.get('chunk') as Blob | null
  if (chunkBlob) {
    // → 청크 모드: 임시 폴더에 저장만 하고, 마지막 청크가 아닐 때는 응답만 반환
    const filename = formData.get('filename')?.toString() || ''
    const chunkIndex = parseInt(
      formData.get('chunkIndex')?.toString() || '0',
      10
    )
    const totalChunks = parseInt(
      formData.get('totalChunks')?.toString() || '0',
      10
    )

    if (!filename || isNaN(chunkIndex) || isNaN(totalChunks)) {
      return NextResponse.json(
        { message: '청크 정보(파일명/인덱스/총개수)가 올바르지 않습니다.' },
        { status: 400 }
      )
    }

    // 임시 청크 디렉토리 설정
    const tempDir = './tmp-chunks'
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir)
    }

    // 청크마다 파일명: `<원본파일명>.chunk-<chunkIndex>`
    const tempFilePath = path.join(tempDir, `${filename}.chunk-${chunkIndex}`)
    // Blob → Buffer로 변환해서 디스크에 저장
    fs.writeFileSync(tempFilePath, Buffer.from(await chunkBlob.arrayBuffer()))

    // 현재까지 저장된 청크 파일 목록 중 이 파일과 동일한 접두어를 가지는 파일들 조회
    const uploadedChunks = fs
      .readdirSync(tempDir)
      .filter((f) => f.startsWith(filename + '.chunk-'))

    // 아직 청크가 다 모이지 않았다면, “청크 저장만 완료” 응답
    if (uploadedChunks.length < totalChunks) {
      return NextResponse.json({ message: '청크 업로드 완료' })
    }

    // ——————————————————————
    // *모든 청크가 모였을 때 실행되는 구간*
    // 2) 전체 파일 합치기
    // 업로드된 청크들을 index 순서대로 정렬
    const sortedChunks = uploadedChunks
      .map((name) => {
        // 파일명이 "myfile.mp3.chunk-3" 이런 식이므로, 뒤 숫자를 꺼내 정렬
        const idx = parseInt(name.split('.chunk-')[1], 10)
        return { name, idx }
      })
      .sort((a, b) => a.idx - b.idx)
      .map((obj) => obj.name)

    // 모든 청크를 Buffer로 읽어 이어 붙이기
    const fullFileBuffer = Buffer.concat(
      sortedChunks.map((chunkFileName) =>
        fs.readFileSync(path.join(tempDir, chunkFileName))
      )
    )

    // 3) (원래 로직) 원본명, 메타데이터 등 가져오기
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

    // 4) 암호화 (원래 로직 그대로)
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

    // 5) GridFS 업로드 (원래 로직 그대로)
    const client = await clientPromise
    const db = client.db()
    const bucket = new GridFSBucket(db, { bucketName: 'uploads' })

    const ext = path.extname(originalName)
    const filenameGridFS = `${uuidv4()}${ext}`

    // Buffer → Readable 스트림으로 변환
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
      },
    })

    // 업로드 완료 대기
    await new Promise<void>((resolve, reject) =>
      readStream.pipe(uploadStream).on('error', reject).on('finish', resolve)
    )
    const fileId = uploadStream.id as ObjectId

    // 6) 암호문 접근용 비밀번호 해시
    let hashedLockPassword: string | undefined
    if (isEncrypted) {
      hashedLockPassword = await bcryptHash(rawLockPwd, 10)
    }

    // 7) 메타 저장 (원래 로직 그대로)
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
    })

    // 8) 임시 청크 파일 삭제
    sortedChunks.forEach((chunkFileName) =>
      fs.unlinkSync(path.join(tempDir, chunkFileName))
    )

    // 최종 업로드 결과 반환
    return NextResponse.json({ id: fileId.toString() })
  }

  // ——————————————————————
  // 만약 “chunk” 필드가 없으면 → 기존 단일 파일 업로드 로직 수행
  // 2) formData에서 file Blob 가져오기
  const title = formData.get('title')?.toString() || ''
  const description = formData.get('description')?.toString() || ''
  const fileBlob = formData.get('file') as Blob | null
  const category = formData.get('category')?.toString() || ''
  if (!fileBlob) {
    return NextResponse.json({ message: '파일이 필요합니다.' }, { status: 400 })
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

  // 3) 파일 버퍼
  const origBuffer = Buffer.from(await fileBlob.arrayBuffer())

  // 4) 암호화 (선택 시)
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
  })

  return NextResponse.json({ id: fileId.toString() })
}
