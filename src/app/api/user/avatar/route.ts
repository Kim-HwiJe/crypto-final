// 파일 경로: src/app/api/user/avatar/route.ts
import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const email = url.searchParams.get('email')
  if (!email) {
    // 예: /api/user/avatar?email= 이 비어 있으면 400 Bad Request
    return NextResponse.json(
      { message: 'email query parameter is required.' },
      { status: 400 }
    )
  }

  // 1) your-db-name 이라는 데이터베이스를 명시적으로 사용
  const client = await clientPromise
  const db = client.db('your-db-name')
  const users = db.collection('users')

  // 2) 이메일로 유저 문서 조회 (avatarUrl만 projection)
  const user = await users.findOne(
    { email },
    { projection: { _id: 0, avatarUrl: 1 } }
  )

  if (!user) {
    // 해당 이메일의 사용자 문서를 못 찾음 → 404 Not Found
    return NextResponse.json(
      { message: `User with email "${email}" not found.` },
      { status: 404 }
    )
  }

  // 3) avatarUrl 반환 (없으면 기본 이미지)
  const avatarUrl = user.avatarUrl || '/default-avatar.png'
  return NextResponse.json({ avatarUrl })
}
