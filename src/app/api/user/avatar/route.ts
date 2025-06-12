import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const email = url.searchParams.get('email')
  if (!email) {
    return NextResponse.json(
      { message: 'email query parameter is required.' },
      { status: 400 }
    )
  }

  const client = await clientPromise
  const db = client.db('your-db-name')
  const users = db.collection('users')

  const user = await users.findOne(
    { email },
    { projection: { _id: 0, avatarUrl: 1 } }
  )

  if (!user) {
    return NextResponse.json(
      { message: `User with email "${email}" not found.` },
      { status: 404 }
    )
  }

  const avatarUrl = user.avatarUrl || '/default-avatar.png'
  return NextResponse.json({ avatarUrl })
}
