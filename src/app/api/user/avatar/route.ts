// 경로: src/app/api/user/avatar/route.ts
import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const email = url.searchParams.get('email') // ?email=foo@bar.com
  if (!email) {
    return NextResponse.json(
      { message: 'email 파라미터가 필요합니다.' },
      { status: 400 }
    )
  }

  // “your-db-name” 데이터베이스에서 users 컬렉션을 조회
  const client = await clientPromise
  const db = client.db('your-db-name') // 명시적으로 your-db-name 사용
  const users = db.collection('users')

  // 이메일로 해당 유저 문서 찾되, avatarUrl만 projection
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

  const avatarUrl = user.avatarUrl || '/default-avatar.png'
  // 기본 아바타가 없을 때는 '/default-avatar.png' 반환
  return NextResponse.json({ avatarUrl })
}
