// src/app/api/user/[email]/route.ts
import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  // 1) URL에서 email 세그먼트 추출
  const url = new URL(request.url)
  const segments = url.pathname.split('/')
  const rawEmail = segments.pop() || '' // 마지막 세그먼트
  const email = decodeURIComponent(rawEmail)

  if (!email) {
    return NextResponse.json(
      { message: 'email 파라미터가 필요합니다.' },
      { status: 400 }
    )
  }

  // 2) DB 조회
  const client = await clientPromise
  const users = client.db('your-db-name').collection('users')
  const user = await users.findOne<{
    name?: string
    avatarUrl?: string
    description?: string
  }>({ email })

  if (!user) {
    return NextResponse.json(
      { message: '해당 유저를 찾을 수 없습니다.' },
      { status: 404 }
    )
  }

  // 3) 응답
  return NextResponse.json({
    name: user.name ?? null,
    avatarUrl: user.avatarUrl ?? null,
    description: user.description ?? null,
  })
}
