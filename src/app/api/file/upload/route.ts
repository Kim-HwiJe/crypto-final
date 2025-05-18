// src/app/api/file/upload/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../auth/[...nextauth]/route'
import clientPromise from '@/lib/mongodb'
import { v4 as uuidv4 } from 'uuid'
import { Readable } from 'stream'
import { GridFSBucket, ObjectId } from 'mongodb'
import { hash as bcryptHash } from 'bcryptjs'
import crypto from 'crypto'
import path from 'path'

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

  // 2) 파일 버퍼
  const origBuffer = Buffer.from(await fileBlob.arrayBuffer())

  // 3) 암호화 (선택 시)
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

  // 4) GridFS 업로드
  const client = await clientPromise
  const db = client.db()
  const bucket = new GridFSBucket(db, { bucketName: 'uploads' })

  const ext = path.extname(originalName)
  const filename = `${uuidv4()}${ext}`

  const readStream = Readable.from(buffer)
  const uploadStream = bucket.openUploadStream(filename, {
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

  // 5) 암호문 접근용 비밀번호 해시
  let hashedLockPassword: string | undefined
  if (isEncrypted) {
    hashedLockPassword = await bcryptHash(rawLockPwd, 10)
  }

  // 6) 메타 저장
  await db.collection('files').insertOne({
    _id: fileId,
    title,
    description,
    filename,
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
