import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { ObjectId, GridFSBucket } from 'mongodb'

export const runtime = 'nodejs'

export async function GET(request: Request, context: any) {
  const { id } = context.params as { id: string }

  if (!ObjectId.isValid(id)) {
    return NextResponse.json(
      { message: '잘못된 파일 ID입니다.' },
      { status: 400 }
    )
  }

  const client = await clientPromise
  const db = client.db()

  const filesColl = db.collection('uploads.files')
  const fileDoc = await filesColl.findOne({ _id: new ObjectId(id) })
  if (!fileDoc) {
    return NextResponse.json(
      { message: 'GridFS에 파일이 없습니다.' },
      { status: 404 }
    )
  }

  const bucket = new GridFSBucket(db, { bucketName: 'uploads' })
  const downloadStream = bucket.openDownloadStream(new ObjectId(id))

  const webStream = new ReadableStream({
    start(controller) {
      downloadStream.on('data', (chunk) => controller.enqueue(chunk))
      downloadStream.on('end', () => controller.close())
      downloadStream.on('error', (err) => controller.error(err))
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
