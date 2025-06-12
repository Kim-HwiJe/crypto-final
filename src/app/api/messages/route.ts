import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export const runtime = 'nodejs'

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json(
      { message: '로그인이 필요합니다.' },
      { status: 401 }
    )
  }
  const me = session.user.email

  const url = new URL(req.url)
  const chatIdParam = url.searchParams.get('chatId')
  if (!chatIdParam) {
    return NextResponse.json(
      { message: 'chatId가 필요합니다.' },
      { status: 400 }
    )
  }
  const [other, fileId] = chatIdParam.split('-')
  if (!other || !ObjectId.isValid(fileId)) {
    return NextResponse.json(
      { message: '잘못된 chatId 형식입니다.' },
      { status: 400 }
    )
  }

  const client = await clientPromise
  const db = client.db()

  await db
    .collection('messages')
    .updateMany(
      { from: other, to: me, fileId, read: { $ne: true } },
      { $set: { read: true } }
    )

  const raw = await db
    .collection('messages')
    .find({ fileId, $or: [{ from: me }, { to: me }] })
    .sort({ createdAt: 1 })
    .toArray()

  const result = raw.map((m: any) => ({
    id: m._id.toString(),
    author: m.from === me ? 'me' : 'them',
    content: m.content,
    timestamp: m.createdAt.toISOString(),
    edited: !!m.edited,
  }))

  return NextResponse.json({ messages: result })
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json(
      { message: '로그인이 필요합니다.' },
      { status: 401 }
    )
  }
  const me = session.user.email

  const { to, fileId, content } = await req.json()
  if (!to || !fileId || !content) {
    return NextResponse.json(
      { message: 'to, fileId, content가 모두 필요합니다.' },
      { status: 400 }
    )
  }
  if (!ObjectId.isValid(fileId)) {
    return NextResponse.json(
      { message: '잘못된 fileId입니다.' },
      { status: 400 }
    )
  }

  const client = await clientPromise
  const db = client.db()
  const fileDoc = await db
    .collection('files')
    .findOne({ _id: new ObjectId(fileId) }, { projection: { ownerEmail: 1 } })

  if (!fileDoc?.ownerEmail) {
    return NextResponse.json(
      { message: '파일 소유자를 찾을 수 없습니다.' },
      { status: 400 }
    )
  }
  const ownerEmail = fileDoc.ownerEmail

  const chatId = `${ownerEmail}-${fileId}`

  const message = {
    chatId,
    from: me,
    to,
    fileId,
    content,
    createdAt: new Date(),
    read: false,
    edited: false,
  }

  const { insertedId } = await db.collection('messages').insertOne(message)

  return NextResponse.json({
    id: insertedId.toString(),
    author: 'me',
    content,
    timestamp: message.createdAt.toISOString(),
    edited: false,
  })
}
