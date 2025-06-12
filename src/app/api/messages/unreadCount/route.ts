import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import clientPromise from '@/lib/mongodb'

export const runtime = 'nodejs'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json(
      { message: '로그인이 필요합니다.' },
      { status: 401 }
    )
  }
  const me = session.user.email
  const client = await clientPromise
  const db = client.db()
  const count = await db
    .collection('messages')
    .countDocuments({ to: me, read: { $ne: true } })

  return NextResponse.json({ count })
}
