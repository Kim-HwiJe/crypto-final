// src/app/api/auth/register/route.ts
import { NextResponse } from 'next/server'
import { hash } from 'bcryptjs'
import clientPromise from '@/lib/mongodb' // (MongoDB 연결 유틸)

export async function POST(request: Request) {
  const { name, email, password } = await request.json()

  const client = await clientPromise
  const db = client.db('your-db-name')
  const users = db.collection('users')

  // 이미 가입된 이메일 체크
  if (await users.findOne({ email })) {
    return NextResponse.json(
      { status: 400, message: '이미 가입된 이메일입니다.' },
      { status: 400 }
    )
  }

  // 비밀번호 해싱
  const hashed = await hash(password, 12)
  await users.insertOne({
    name,
    email,
    password: hashed,
    createdAt: new Date(),
  })

  return NextResponse.json({ status: 'success', message: '회원가입 성공' })
}
