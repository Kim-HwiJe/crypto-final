import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import clientPromise from '@/lib/mongodb'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
  }
  const email = session.user.email

  const client = await clientPromise

  const userDb = client.db('your-db-name')
  const user = await userDb
    .collection('users')
    .findOne({ email }, { projection: { password: 0 } })
  if (!user) {
    return NextResponse.json(
      { error: '유저를 찾을 수 없습니다.' },
      { status: 404 }
    )
  }

  const appDb = client.db()
  const followDocs = await appDb
    .collection<{ follower: string; following: string }>('follows')
    .find({ follower: email })
    .toArray()
  const following = followDocs.map((doc) => doc.following)

  return NextResponse.json({
    ...user,
    following, // string[]
  })
}
