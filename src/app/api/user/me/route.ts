// src/app/api/user/me/route.ts

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import clientPromise from '@/lib/mongodb'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  // 1) 로그인 세션 확인
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
  }
  const email = session.user.email

  // 2) DB 연결
  const client = await clientPromise

  // 3) 사용자 정보는 'your-db-name' 에서 조회
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

  // 4) 팔로우 정보는 기본 DB의 'follows' 컬렉션에서 조회
  const appDb = client.db()
  const followDocs = await appDb
    .collection<{ follower: string; following: string }>('follows')
    .find({ follower: email })
    .toArray()
  const following = followDocs.map((doc) => doc.following)

  // 5) 최종 응답
  return NextResponse.json({
    ...user,
    following, // string[]
  })
}
