// src/app/api/file/route.ts
import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'

export const runtime = 'nodejs'

export async function GET() {
  const client = await clientPromise
  const filesColl = client.db().collection('files')

  // projection에 ownerAvatar 제거 → ownerEmail만 내려준다
  const files = await filesColl
    .find(
      {},
      {
        projection: {
          _id: 1,
          title: 1,
          filename: 1,
          originalName: 1,
          ownerName: 1,
          ownerEmail: 1, // ← 이 필드만 내려준다
          createdAt: 1,
          isEncrypted: 1,
          isLocked: 1,
          views: 1,
          category: 1,
        },
      }
    )
    .toArray()

  const result = files.map((f) => ({
    id: f._id.toString(),
    title: f.title,
    filename: f.filename,
    originalName: f.originalName,
    ownerName: f.ownerName,
    ownerEmail: f.ownerEmail, // ← 클라이언트에서 이 이메일로 최신 아바타를 요청
    createdAt:
      f.createdAt instanceof Date ? f.createdAt.toISOString() : f.createdAt,
    isEncrypted: f.isEncrypted,
    isLocked: f.isLocked ?? false,
    views: f.views ?? 0,
    category: f.category,
  }))

  return NextResponse.json(result)
}
