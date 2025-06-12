import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const segments = url.pathname.split('/')
  const rawEmail = segments.pop() || ''
  const email = decodeURIComponent(rawEmail)

  if (!email) {
    return NextResponse.json(
      { message: 'email 파라미터가 필요합니다.' },
      { status: 400 }
    )
  }

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

  return NextResponse.json({
    name: user.name ?? null,
    avatarUrl: user.avatarUrl ?? null,
    description: user.description ?? null,
  })
}
