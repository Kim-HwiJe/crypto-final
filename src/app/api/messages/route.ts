import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export const runtime = 'nodejs'

export async function GET(req: Request) {
  // 1) 로그인 확인
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json(
      { message: '로그인이 필요합니다.' },
      { status: 401 }
    )
  }
  const me = session.user.email

  // 2) chatId 파라미터 분해
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

  // 3) 상대 → 나 방향의 안 읽은 메시지 모두 읽음 처리
  await db
    .collection('messages')
    .updateMany(
      { from: other, to: me, fileId, read: { $ne: true } },
      { $set: { read: true } }
    )

  // 4) 해당 파일에서 나↔상대의 모든 메시지 조회
  const raw = await db
    .collection('messages')
    .find({ fileId, $or: [{ from: me }, { to: me }] })
    .sort({ createdAt: 1 })
    .toArray()

  // 5) author 구분 후 포맷
  const result = raw.map((m: any) => ({
    id: m._id.toString(),
    author: m.from === me ? 'me' : 'them',
    content: m.content,
    timestamp: m.createdAt.toISOString(),
  }))

  return NextResponse.json({ messages: result })
}

export async function POST(req: Request) {
  // 1) 로그인 확인
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json(
      { message: '로그인이 필요합니다.' },
      { status: 401 }
    )
  }
  const me = session.user.email

  // 2) 요청 파싱
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

  // 3) 파일 소유자(ownerEmail) 조회
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

  // 4) chatId는 항상 “ownerEmail-fileId”
  const chatId = `${ownerEmail}-${fileId}`

  // 5) 메시지 저장 (read=false)
  const message = {
    chatId,
    from: me,
    to,
    fileId,
    content,
    createdAt: new Date(),
    read: false,
  }
  const { insertedId } = await db.collection('messages').insertOne(message)

  // 6) 저장된 메시지 바로 반환
  return NextResponse.json({
    id: insertedId.toString(),
    author: 'me',
    content,
    timestamp: message.createdAt.toISOString(),
  })
}
