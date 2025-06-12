export const runtime = 'nodejs'

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import clientPromise from '@/lib/mongodb'
import { compare, hash } from 'bcryptjs'

export async function POST(request: Request) {
  const { oldPassword, newPassword } = await request.json()

  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json(
      { message: '로그인이 필요합니다.' },
      { status: 401 }
    )
  }
  const email = session.user.email

  const client = await clientPromise
  const users = client.db('your-db-name').collection('users')
  const user = await users.findOne({ email })
  if (!user) {
    return NextResponse.json(
      { message: '사용자를 찾을 수 없습니다.' },
      { status: 404 }
    )
  }

  if (oldPassword) {
    const isMatch = await compare(oldPassword, user.password)
    if (!isMatch) {
      return NextResponse.json(
        { message: '기존 비밀번호가 올바르지 않습니다.' },
        { status: 400 }
      )
    }
  }

  const newHashed = await hash(newPassword, 12)
  await users.updateOne({ email }, { $set: { password: newHashed } })

  return NextResponse.json(
    { message: '비밀번호가 성공적으로 변경되었습니다.' },
    { status: 200 }
  )
}
