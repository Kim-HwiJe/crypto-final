// src/app/api/file/[id]/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import clientPromise from '@/lib/mongodb'
import { ObjectId, GridFSBucket } from 'mongodb'
import { hash as bcryptHash } from 'bcryptjs'

export const runtime = 'nodejs'

// 파일 정보 조회
export async function GET(request: Request, context: any) {
  const { id } = context.params as { id: string }
  if (!ObjectId.isValid(id)) {
    return NextResponse.json(
      { message: '잘못된 파일 ID입니다.' },
      { status: 400 }
    )
  }

  const client = await clientPromise
  const db = client.db()
  const filesColl = db.collection('files')

  const doc = await filesColl.findOne({ _id: new ObjectId(id) })
  if (!doc) {
    return NextResponse.json(
      { message: '파일을 찾을 수 없습니다.' },
      { status: 404 }
    )
  }

  await filesColl.updateOne({ _id: doc._id }, { $inc: { views: 1 } })

  return NextResponse.json({
    id: doc._id.toString(),
    title: doc.title,
    description: doc.description,
    originalName: doc.originalName,
    category: doc.category,
    isEncrypted: doc.isEncrypted,
    algorithm: doc.algorithm ?? null,
    expiresAt: doc.expiresAt?.toISOString() ?? null,
    ownerEmail: doc.ownerEmail,
    ownerName: doc.ownerName,
    ownerAvatar: doc.ownerAvatar,
    createdAt: doc.createdAt.toISOString(),
    views: doc.views ?? 0,
    lockPassword: doc.lockPassword, // 최신 암호화 비밀번호 반환
  })
}

// 파일 정보 수정
export async function PATCH(request: Request, context: any) {
  const { id } = context.params as { id: string }
  if (!ObjectId.isValid(id)) {
    return NextResponse.json(
      { message: '잘못된 파일 ID입니다.' },
      { status: 400 }
    )
  }

  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json(
      { message: '로그인이 필요합니다.' },
      { status: 401 }
    )
  }
  const userEmail = session.user.email

  const body = await request.json()
  const {
    title,
    description,
    category,
    expiresAt,
    isEncrypted,
    algorithm,
    lockPassword, // 복호화 비밀번호
  } = body

  const client = await clientPromise
  const filesColl = client.db().collection('files')
  const existing = await filesColl.findOne({ _id: new ObjectId(id) })
  if (!existing) {
    return NextResponse.json(
      { message: '파일을 찾을 수 없습니다.' },
      { status: 404 }
    )
  }
  if (existing.ownerEmail !== userEmail) {
    return NextResponse.json({ message: '권한이 없습니다.' }, { status: 403 })
  }

  const updateFields: Record<string, unknown> = {}
  if (title !== undefined) updateFields.title = title
  if (description !== undefined) updateFields.description = description
  if (category !== undefined) updateFields.category = category
  if (expiresAt !== undefined) updateFields.expiresAt = new Date(expiresAt)

  // 암호화 설정 변경 시
  if (isEncrypted !== undefined) {
    updateFields.isEncrypted = isEncrypted
    updateFields.algorithm = isEncrypted ? algorithm : null

    // 복호화 비밀번호 변경
    if (isEncrypted && lockPassword) {
      updateFields.lockPassword = await bcryptHash(lockPassword, 10)
    } else {
      updateFields.lockPassword = null
    }
  }

  await filesColl.updateOne({ _id: new ObjectId(id) }, { $set: updateFields })

  return NextResponse.json({ message: '메타데이터가 수정되었습니다.' })
}

// 파일 삭제
export async function DELETE(request: Request, context: any) {
  const { id } = context.params as { id: string }
  if (!ObjectId.isValid(id)) {
    return NextResponse.json(
      { message: '잘못된 파일 ID입니다.' },
      { status: 400 }
    )
  }

  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json(
      { message: '로그인이 필요합니다.' },
      { status: 401 }
    )
  }
  const userEmail = session.user.email

  const client = await clientPromise
  const db = client.db()
  const filesColl = db.collection('files')

  const doc = await filesColl.findOne({ _id: new ObjectId(id) })
  if (!doc) {
    return NextResponse.json(
      { message: '파일을 찾을 수 없습니다.' },
      { status: 404 }
    )
  }
  if (doc.ownerEmail !== userEmail) {
    return NextResponse.json({ message: '권한이 없습니다.' }, { status: 403 })
  }

  // GridFS 버킷에서 파일 삭제
  const bucket = new GridFSBucket(db, { bucketName: 'uploads' })
  await bucket.delete(new ObjectId(id))
  // 메타데이터 삭제
  await filesColl.deleteOne({ _id: new ObjectId(id) })

  return NextResponse.json({ message: '파일이 삭제되었습니다.' })
}
