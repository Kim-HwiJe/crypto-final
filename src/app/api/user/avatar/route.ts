// 경로: src/app/api/user/avatar/route.ts

import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

export const runtime = 'nodejs'

/**
 * GET /api/user/avatar?email={email}
 *   - 쿼리 파라미터로 email(유저 이메일)을 받아,
 *     해당 유저의 avatarUrl을 반환
 *   - 로그인 여부와 상관없이(공개 프로필 정보), 이메일만 있으면 누구나 호출 가능
 */
export async function GET(request: Request) {
  const url = new URL(request.url)
  const email = url.searchParams.get('email')
  if (!email) {
    return NextResponse.json(
      { message: 'email 파라미터가 필요합니다.' },
      { status: 400 }
    )
  }

  const client = await clientPromise
  const db = client.db('your-db-name')
  const users = db.collection('users')

  // users 컬렉션에서 password 제외하고 avatarUrl만 꺼냄
  const user = await users.findOne(
    { email },
    { projection: { _id: 0, avatarUrl: 1 } }
  )
  if (!user) {
    return NextResponse.json(
      { message: '해당 이메일의 사용자를 찾을 수 없습니다.' },
      { status: 404 }
    )
  }

  // avatarUrl이 없으면 기본값으로 대체
  const avatarUrl = user.avatarUrl || '/default-avatar.png'
  return NextResponse.json({ avatarUrl })
}
