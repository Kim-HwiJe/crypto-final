// src/app/api/file/[id]/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import clientPromise from '@/lib/mongodb'
import { ObjectId, GridFSBucket } from 'mongodb'
import { hash as bcryptHash } from 'bcryptjs'

export const runtime = 'nodejs'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

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

  await filesColl.updateOne({ _id: new ObjectId(id) }, { $inc: { views: 1 } })

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
    lockPassword: doc.lockPassword ?? null,
  })
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

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
    lockPassword,
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

  const updateFields: Partial<{
    title: string
    description: string
    category: string
    expiresAt: Date | null
    isEncrypted: boolean
    algorithm: string | null
    lockPassword: string | null
  }> = {}

  if (title !== undefined) updateFields.title = title
  if (description !== undefined) updateFields.description = description
  if (category !== undefined) updateFields.category = category
  if (expiresAt !== undefined) {
    updateFields.expiresAt = expiresAt ? new Date(expiresAt) : null
  }

  await filesColl.updateOne({ _id: new ObjectId(id) }, { $set: updateFields })

  return NextResponse.json({ message: '메타데이터가 수정되었습니다.' })
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

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

  // GridFSBucket을 사용해 실제 업로드된 파일 삭제
  const bucket = new GridFSBucket(db, { bucketName: 'uploads' })
  await bucket.delete(new ObjectId(id))
  // 메타데이터 컬렉션에서 문서 삭제
  await filesColl.deleteOne({ _id: new ObjectId(id) })

  return NextResponse.json({ message: '파일이 삭제되었습니다.' })
}
