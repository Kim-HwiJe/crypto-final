// src/app/api/user/avatar/route.ts
import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const email = url.searchParams.get('email')
  if (!email) {
    return NextResponse.json(
      { message: 'email 파라미터가 필요합니다.' },
      { status: 400 }
    )
  }

  // 1) MongoDB 연결
  const client = await clientPromise
  const db = client.db('your-db-name') // 실제 DB 이름 확인
  const users = db.collection('users')

  // 2) 해당 이메일의 사용자를 찾되 password는 제외
  const user = await users.findOne(
    { email },
    {
      projection: {
        password: 0,
        _id: 0 /* 다른 필드 제거, avatarUrl만 반환해도 됨 */,
      },
    }
  )
  if (!user) {
    return NextResponse.json(
      { message: '해당 이메일의 사용자를 찾을 수 없습니다.' },
      { status: 404 }
    )
  }

  // 3) avatarUrl만 꺼내서 반환
  const avatarUrl = user.avatarUrl || '/default-avatar.png'
  return NextResponse.json({ avatarUrl })
}
