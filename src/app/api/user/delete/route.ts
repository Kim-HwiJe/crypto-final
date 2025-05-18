// src/app/api/user/delete/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../auth/[...nextauth]/route'
import clientPromise from '@/lib/mongodb'
import { ObjectId, GridFSBucket } from 'mongodb'
import bcrypt from 'bcryptjs'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  // 1) 세션 확인
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json(
      { message: '로그인이 필요합니다.' },
      { status: 401 }
    )
  }
  const email = session.user.email

  // 2) 클라이언트가 보낸 비밀번호 검증
  const { password } = await req.json()
  if (!password) {
    return NextResponse.json(
      { message: '비밀번호를 입력해주세요.' },
      { status: 400 }
    )
  }

  const client = await clientPromise
  const db = client.db('your-db-name')

  // 3) 유저 정보 조회
  const user = await db.collection('users').findOne({
    email,
  })
  if (!user) {
    return NextResponse.json(
      { message: '유저를 찾을 수 없습니다.' },
      { status: 404 }
    )
  }

  // 4) 비밀번호 검증
  const match = await bcrypt.compare(password, user.password)
  if (!match) {
    return NextResponse.json(
      { message: '비밀번호가 틀렸습니다.' },
      { status: 401 }
    )
  }

  // 5) 사용자가 올린 파일들 삭제
  const fileDb = client.db() // 기본 DB
  const files = await fileDb
    .collection('files')
    .find({ ownerEmail: email })
    .toArray()

  const bucket = new GridFSBucket(fileDb, { bucketName: 'uploads' })
  for (const f of files) {
    // GridFS 상의 실제 청크+메타 삭제
    await bucket.delete(new ObjectId(f._id))
  }
  // 메타데이터 컬렉션에서 일괄 삭제
  await fileDb.collection('files').deleteMany({ ownerEmail: email })

  // 6) users 컬렉션에서 유저 삭제
  await db.collection('users').deleteOne({ email })

  // 7) 응답
  return NextResponse.json({ message: '탈퇴가 완료되었습니다.' })
}
