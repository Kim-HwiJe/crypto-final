// 경로: src/app/api/file/[id]/stream/route.ts

import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { ObjectId, GridFSBucket } from 'mongodb'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

export const runtime = 'nodejs'

export async function GET(req: Request, context: any) {
  // 1) context.params에서 id 추출 및 유효성 검사
  const { id } = context.params as { id: string }
  if (!ObjectId.isValid(id)) {
    return NextResponse.json(
      { message: '잘못된 파일 ID입니다.' },
      { status: 400 }
    )
  }

  // 2) MongoDB 연결 및 메타 조회
  const client = await clientPromise
  const db = client.db()
  const filesColl = db.collection('files')
  // 여기서 plainLength도 같이 읽어온다
  const meta = await filesColl.findOne<{
    lockPassword?: string
    isEncrypted?: boolean
    plainLength?: number
  }>({ _id: new ObjectId(id) })

  if (!meta) {
    return NextResponse.json(
      { message: '파일 메타를 찾을 수 없습니다.' },
      { status: 404 }
    )
  }

  // 다운로드 진행률 계산을 위해 plainLength가 반드시 필요
  const plainLength = meta.plainLength
  if (plainLength == null) {
    return NextResponse.json(
      { message: 'plainLength가 메타에 없습니다.' },
      { status: 500 }
    )
  }

  // 3) GridFS 파일 문서 조회 (contentType, metadata 등)
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
  let downloadStream = bucket.openDownloadStream(new ObjectId(id))
  let finalStream: NodeJS.ReadableStream = downloadStream

  // 5) ?password=xxx 쿼리 파라미터가 있으면 복호화 처리
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
      const alg = (em.algorithm || '').toLowerCase() // "aes-256-gcm", "aes-256-cbc", "chacha20-poly1305"
      const key = Buffer.from(em.key, 'hex')
      const iv = Buffer.from(em.iv, 'hex')

      if (alg === 'aes-256-gcm' || alg === 'chacha20-poly1305') {
        if (!em.authTag) {
          return NextResponse.json(
            { message: 'AuthTag가 없습니다.' },
            { status: 500 }
          )
        }
        const decipher = crypto.createDecipheriv(
          alg,
          key,
          iv
        ) as crypto.DecipherGCM
        decipher.setAuthTag(Buffer.from(em.authTag, 'hex'))
        finalStream = downloadStream.pipe(decipher)
      } else if (alg === 'aes-256-cbc') {
        const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv)
        finalStream = downloadStream.pipe(decipher)
      } else {
        return NextResponse.json(
          { message: '지원하지 않는 알고리즘입니다.' },
          { status: 400 }
        )
      }
    }
  }

  // 6) Node.js ReadableStream을 Web ReadableStream으로 변환
  //    enqueue 시마다 Uint8Array 로 변환
  const webStream = new ReadableStream({
    async pull(controller) {
      for await (const chunk of finalStream) {
        // chunk가 Buffer일 경우 Uint8Array로 변환
        controller.enqueue(
          chunk instanceof Buffer ? new Uint8Array(chunk) : chunk
        )
      }
      controller.close()
    },
    cancel() {
      if (typeof (finalStream as any).destroy === 'function') {
        ;(finalStream as any).destroy()
      }
    },
  })

  // 7) 응답: Web 스트림 + 헤더(파일명, 전체 바이트 길이=plainLength)
  return new NextResponse(webStream as any, {
    headers: {
      'Content-Type': fileDoc.contentType || 'application/octet-stream',
      'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(
        (fileDoc.metadata as any)?.originalName || fileDoc.filename
      )}`,
      'Content-Length': String(plainLength), // 평문 전체 바이트 길이
    },
  })
}
