// src/app/api/messages/unreadCount/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import clientPromise from '@/lib/mongodb'

export const runtime = 'nodejs'

export async function GET() {
  // 1) 로그인 검사
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json(
      { message: '로그인이 필요합니다.' },
      { status: 401 }
    )
  }
  const me = session.user.email

  // 2) 아직 읽지 않은(to=me && read ≠ true) 메시지 개수 세기
  const client = await clientPromise
  const db = client.db()
  const count = await db
    .collection('messages')
    .countDocuments({ to: me, read: { $ne: true } })

  // 3) 반환
  return NextResponse.json({ count })
}
