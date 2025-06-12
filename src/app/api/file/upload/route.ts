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

  const chunkBlob = formData.get('chunk') as Blob | null
  if (chunkBlob) {
    const filename = formData.get('filename')?.toString() || ''
    const chunkIndex = parseInt(
      formData.get('chunkIndex')?.toString() || '0',
      10
    )
    const totalChunks = parseInt(
      formData.get('totalChunks')?.toString() || '0',
      10
    )

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

    const tempDir = '/tmp/tmp-chunks'
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true })
    }

    const tempFilePath = path.join(tempDir, `${filename}.chunk-${chunkIndex}`)

    fs.writeFileSync(tempFilePath, Buffer.from(await chunkBlob.arrayBuffer()))

    const uploadedChunks = fs
      .readdirSync(tempDir)
      .filter((f) => f.startsWith(`${filename}.chunk-`))

    if (uploadedChunks.length < totalChunks) {
      return NextResponse.json({ message: '청크 업로드 완료' })
    }

    const sortedChunks = uploadedChunks
      .map((name) => {
        const idx = parseInt(name.split('.chunk-')[1], 10)
        return { name, idx }
      })
      .sort((a, b) => a.idx - b.idx)
      .map((obj) => obj.name)

    const fullFileBuffer = Buffer.concat(
      sortedChunks.map((chunkFileName) =>
        fs.readFileSync(path.join(tempDir, chunkFileName))
      )
    )

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
        plainLength,
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
      plainLength,
    })

    sortedChunks.forEach((chunkFileName) =>
      fs.unlinkSync(path.join(tempDir, chunkFileName))
    )

    return NextResponse.json({ id: fileId.toString() })
  }

  const title = formData.get('title')?.toString() || ''
  const description = formData.get('description')?.toString() || ''
  const fileBlob = formData.get('file') as Blob | null
  const category = formData.get('category')?.toString() || ''
  if (!fileBlob) {
    return NextResponse.json({ message: '파일이 필요합니다.' }, { status: 400 })
  }

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

  const originalName = (fileBlob as any).name

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

  const origBuffer = Buffer.from(await fileBlob.arrayBuffer())

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

  let hashedLockPassword: string | undefined
  if (isEncrypted) {
    hashedLockPassword = await bcryptHash(rawLockPwd, 10)
  }

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
    plainLength: plainLengthSingle,
  })

  return NextResponse.json({ id: fileId.toString() })
}
