import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'

import clientPromise from '@/lib/mongodb'
import { authOptions } from '@/lib/auth'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  const me = session?.user?.email
  if (!me)
    return NextResponse.json(
      { message: '로그인이 필요합니다.' },
      { status: 401 }
    )

  const { targetEmail } = await req.json()
  if (typeof targetEmail !== 'string' || targetEmail === me) {
    return NextResponse.json({ message: '잘못된 요청입니다.' }, { status: 400 })
  }

  const client = await clientPromise
  const db = client.db()
  // upsert 로 중복 방지
  await db.collection('follows').updateOne(
    { follower: me, following: targetEmail },
    {
      $setOnInsert: {
        follower: me,
        following: targetEmail,
        createdAt: new Date(),
      },
    },
    { upsert: true }
  )
  return NextResponse.json({ message: '팔로우 성공' })
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions)
  const me = session?.user?.email
  if (!me)
    return NextResponse.json(
      { message: '로그인이 필요합니다.' },
      { status: 401 }
    )

  const { targetEmail } = await req.json()
  if (typeof targetEmail !== 'string') {
    return NextResponse.json({ message: '잘못된 요청입니다.' }, { status: 400 })
  }

  const client = await clientPromise
  const db = client.db()
  await db
    .collection('follows')
    .deleteOne({ follower: me, following: targetEmail })
  return NextResponse.json({ message: '언팔로우 성공' })
}
