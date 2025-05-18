// src/app/api/user/me/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../auth/[...nextauth]/route'
import clientPromise from '@/lib/mongodb'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const email = session.user.email
  const client = await clientPromise
  const user = await client
    .db()
    .collection('users')
    .findOne({ email }, { projection: { password: 0 } })
  return NextResponse.json(user)
}
