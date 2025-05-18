// src/app/api/file/[id]/download/route.ts
import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { ObjectId, GridFSBucket } from 'mongodb'

export const runtime = 'nodejs'

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params
  if (!ObjectId.isValid(id)) {
    return NextResponse.json(
      { message: '잘못된 파일 ID입니다.' },
      { status: 400 }
    )
  }

  const client = await clientPromise
  const db = client.db()

  // GridFS에서 파일 문서 찾기
  const filesColl = db.collection('uploads.files')
  const fileDoc = await filesColl.findOne({ _id: new ObjectId(id) })
  if (!fileDoc) {
    return NextResponse.json(
      { message: 'GridFS에 파일이 없습니다.' },
      { status: 404 }
    )
  }

  // 스트림 열기 (암호화 여부 무시)
  const bucket = new GridFSBucket(db, { bucketName: 'uploads' })
  const downloadStream = bucket.openDownloadStream(new ObjectId(id))

  const webStream = new ReadableStream({
    start(ctrl) {
      downloadStream.on('data', (chunk) => ctrl.enqueue(chunk))
      downloadStream.on('end', () => ctrl.close())
      downloadStream.on('error', (err) => ctrl.error(err))
    },
  })

  const originalName =
    (fileDoc.metadata as any)?.originalName || fileDoc.filename

  return new NextResponse(webStream, {
    headers: {
      'Content-Type': fileDoc.contentType || 'application/octet-stream',
      'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(
        originalName
      )}`,
    },
  })
}
