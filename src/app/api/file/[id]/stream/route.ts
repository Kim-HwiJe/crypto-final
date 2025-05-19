import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { ObjectId, GridFSBucket } from 'mongodb'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

export const runtime = 'nodejs'

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { id } = await params // <- 여기서 `await` 추가

  if (!ObjectId.isValid(id)) {
    return NextResponse.json(
      { message: '잘못된 파일 ID입니다.' },
      { status: 400 }
    )
  }

  const client = await clientPromise
  const db = client.db()

  // 1) 메타 가져오기
  const filesColl = db.collection('files')
  const meta = await filesColl.findOne<{
    lockPassword?: string
    isEncrypted?: boolean
  }>({ _id: new ObjectId(id) })
  if (!meta) {
    return NextResponse.json(
      { message: '파일 메타를 찾을 수 없습니다.' },
      { status: 404 }
    )
  }

  // 2) GridFS에서 원본청크 읽어 합치기
  const bucket = new GridFSBucket(db, { bucketName: 'uploads' })
  const filesFiles = db.collection('uploads.files')
  const fileDoc = await filesFiles.findOne({ _id: new ObjectId(id) })
  if (!fileDoc) {
    return NextResponse.json(
      { message: 'GridFS에 파일이 없습니다.' },
      { status: 404 }
    )
  }

  const chunks: Buffer[] = []
  await new Promise<void>((resolve, reject) => {
    bucket
      .openDownloadStream(new ObjectId(id))
      .on('data', (c) => chunks.push(c))
      .on('end', () => resolve())
      .on('error', (e) => reject(e))
  })
  let buf = Buffer.concat(chunks)

  // 3) ?password=xxx 쿼리가 있으면 복호화 시도
  const provided = new URL(req.url).searchParams.get('password')
  if (provided != null) {
    // 3-1) 비밀번호 검증
    if (!meta.lockPassword) {
      return NextResponse.json(
        { message: '비밀번호가 설정되지 않은 파일입니다.' },
        { status: 400 }
      )
    }
    const ok = await bcrypt.compare(provided, meta.lockPassword)
    if (!ok) {
      return NextResponse.json(
        { message: '비밀번호가 틀렸습니다.' },
        { status: 401 }
      )
    }

    // 3-2) 복호화
    const em = (fileDoc.metadata as any)?.encryptionMeta
    if (meta.isEncrypted && em) {
      const key = Buffer.from(em.key, 'hex')
      const iv = Buffer.from(em.iv, 'hex')
      const alg = (em.algorithm || '').toLowerCase()

      if (['aes-256-gcm', 'chacha20-poly1305'].includes(alg)) {
        const decipher = crypto.createDecipheriv(
          alg,
          key,
          iv
        ) as crypto.DecipherGCM
        if (!em.authTag) {
          return NextResponse.json(
            { message: 'AuthTag가 없습니다.' },
            { status: 500 }
          )
        }
        decipher.setAuthTag(Buffer.from(em.authTag, 'hex'))
        buf = Buffer.concat([decipher.update(buf), decipher.final()])
      } else if (alg === 'aes-256-cbc') {
        const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv)
        buf = Buffer.concat([decipher.update(buf), decipher.final()])
      } else {
        return NextResponse.json(
          { message: '지원하지 않는 알고리즘입니다.' },
          { status: 400 }
        )
      }
    }
  }

  const originalName =
    (fileDoc.metadata as any)?.originalName || fileDoc.filename

  const webStream = new ReadableStream({
    start(ctrl) {
      ctrl.enqueue(buf)
      ctrl.close()
    },
  })

  return new NextResponse(webStream, {
    headers: {
      'Content-Type': fileDoc.contentType || 'application/octet-stream',
      'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(
        originalName
      )}`,
    },
  })
}
