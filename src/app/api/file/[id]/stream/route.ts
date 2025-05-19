// src/app/api/file/[id]/stream/route.ts
import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { ObjectId, GridFSBucket } from 'mongodb'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
// Node.js 스트림 유틸 (v18+)
import { Readable } from 'stream'

export const runtime = 'nodejs'

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  // 1) params.id 추출
  const { id } = await params
  if (!ObjectId.isValid(id)) {
    return NextResponse.json(
      { message: '잘못된 파일 ID입니다.' },
      { status: 400 }
    )
  }

  // 2) DB 연결 및 메타 조회
  const client = await clientPromise
  const db = client.db()
  const filesColl = db.collection('files')
  const meta = await filesColl.findOne<{
    lockPassword?: string
    isEncrypted?: boolean
  }>({
    _id: new ObjectId(id),
  })
  if (!meta) {
    return NextResponse.json(
      { message: '파일 메타를 찾을 수 없습니다.' },
      { status: 404 }
    )
  }

  // 3) GridFS 파일문서 조회 (length 포함)
  const filesFiles = db.collection('uploads.files')
  const fileDoc = await filesFiles.findOne<any>({ _id: new ObjectId(id) })
  if (!fileDoc) {
    return NextResponse.json(
      { message: 'GridFS에 파일이 없습니다.' },
      { status: 404 }
    )
  }

  // 4) GridFSBucket 스트림 생성
  const bucket = new GridFSBucket(db, { bucketName: 'uploads' })
  // NodeJS.ReadableStream 타입으로 선언
  let nodeStream: NodeJS.ReadableStream = bucket.openDownloadStream(
    new ObjectId(id)
  )

  // 5) ?password=xxx 이면 복호화 검사 및 스트림 파이핑
  const provided = new URL(req.url).searchParams.get('password')
  if (provided != null) {
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
        nodeStream = nodeStream.pipe(decipher)
      } else if (alg === 'aes-256-cbc') {
        const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv)
        nodeStream = nodeStream.pipe(decipher)
      } else {
        return NextResponse.json(
          { message: '지원하지 않는 알고리즘입니다.' },
          { status: 400 }
        )
      }
    }
  }

  // 6) Node 스트림 → Web 스트림 변환
  const webStream = Readable.toWeb(nodeStream as any)

  // 7) 응답: 스트림 바디 + 헤더(파일명, 길이)
  return new NextResponse(webStream as any, {
    headers: {
      'Content-Type': fileDoc.contentType || 'application/octet-stream',
      'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(
        (fileDoc.metadata as any)?.originalName || fileDoc.filename
      )}`,
      // 전체 바이트 길이를 내려줘야 클라이언트에서 진행률 계산이 가능합니다.
      'Content-Length': String(fileDoc.length),
    },
  })
}
