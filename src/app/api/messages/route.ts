// src/app/api/messages/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import clientPromise from '@/lib/mongodb'

export const runtime = 'nodejs'

export async function GET(req: Request) {
  // 1) 로그인된 사용자 확인
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json(
      { message: '로그인이 필요합니다.' },
      { status: 401 }
    )
  }

  // 2) chatId 파라미터 받아오기
  const url = new URL(req.url)
  const chatId = url.searchParams.get('chatId')
  if (!chatId) {
    return NextResponse.json(
      { message: 'chatId 파라미터가 필요합니다.' },
      { status: 400 }
    )
  }

  // 3) DB에서 해당 chatId로 메시지 조회
  const client = await clientPromise
  const db = client.db()
  const messages = await db
    .collection('messages')
    .find({ chatId })
    .sort({ createdAt: 1 })
    .toArray()

  // 4) 발신자 리스트를 뽑아서 유저 컬렉션에서 아바타를 조회
  const me = session.user.email
  const senders = Array.from(new Set(messages.map((m: any) => m.from)))
  const users = await db
    .collection('users')
    .find({ email: { $in: senders } })
    .project({ email: 1, image: 1 })
    .toArray()
  const avatarMap = users.reduce<Record<string, string>>((acc, u: any) => {
    if (u.email) acc[u.email] = u.image
    return acc
  }, {})

  // 5) 프론트에 보낼 형태로 가공
  const result = messages.map((m: any) => {
    const author = m.from === me ? 'me' : 'them'
    const avatarUrl =
      m.from === me
        ? session.user?.image || '/default-avatar.png'
        : avatarMap[m.from] || '/default-avatar.png'
    return {
      id: m._id.toString(),
      author,
      content: m.content,
      timestamp: m.createdAt.toISOString(),
      avatarUrl,
    }
  })

  return NextResponse.json({ messages: result })
}

export async function POST(req: Request) {
  // 1) 로그인된 사용자 확인
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json(
      { message: '로그인이 필요합니다.' },
      { status: 401 }
    )
  }
  const me = session.user.email

  // 2) 요청 바디 파싱
  const { chatId, to, fileId, content } = await req.json()
  if (!chatId || !to || !fileId || !content) {
    return NextResponse.json(
      { message: 'chatId, to, fileId, content가 모두 필요합니다.' },
      { status: 400 }
    )
  }

  // 3) 메시지 저장
  const client = await clientPromise
  const db = client.db()
  const message = {
    chatId,
    from: me,
    to,
    fileId,
    content,
    createdAt: new Date(),
  }
  const { insertedId } = await db.collection('messages').insertOne(message)

  // 4) 저장된 메시지를 곧바로 반환 (내 아바타 URL 포함)
  return NextResponse.json({
    id: insertedId.toString(),
    author: 'me',
    content,
    timestamp: message.createdAt.toISOString(),
    avatarUrl: session.user.image || '/default-avatar.png',
  })
}
