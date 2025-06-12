import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import clientPromise from '@/lib/mongodb'
import { ObjectId, GridFSBucket } from 'mongodb'
import bcrypt from 'bcryptjs'

export const runtime = 'nodejs'

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json(
      { message: '로그인이 필요합니다.' },
      { status: 401 }
    )
  }
  const email = session.user.email

  const { password } = await req.json()
  if (!password) {
    return NextResponse.json(
      { message: '비밀번호를 입력해주세요.' },
      { status: 400 }
    )
  }

  const client = await clientPromise
  const db = client.db('your-db-name')
  const user = await db.collection('users').findOne({ email })
  if (!user) {
    return NextResponse.json(
      { message: '유저를 찾을 수 없습니다.' },
      { status: 404 }
    )
  }

  const match = await bcrypt.compare(password, user.password)
  if (!match) {
    return NextResponse.json(
      { message: '비밀번호가 틀렸습니다.' },
      { status: 401 }
    )
  }

  const fileDb = client.db()
  const files = await fileDb
    .collection('files')
    .find({ ownerEmail: email })
    .toArray()

  const bucket = new GridFSBucket(fileDb, { bucketName: 'uploads' })
  for (const f of files) {
    await bucket.delete(new ObjectId(f._id))
  }

  await fileDb.collection('files').deleteMany({ ownerEmail: email })

  await fileDb.collection('messages').deleteMany({
    $or: [{ from: email }, { to: email }],
  })

  await db.collection('users').deleteOne({ email })

  return NextResponse.json({ message: '탈퇴가 완료되었습니다.' })
}
