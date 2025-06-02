// src/app/api/file/route.ts
import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'

export const runtime = 'nodejs'

export async function GET() {
  const client = await clientPromise
  const filesColl = client.db().collection('files')

  // 1) files 컬렉션에서 필요한 필드들만 projection
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
          ownerAvatar: 1,
          createdAt: 1,
          isEncrypted: 1,
          isLocked: 1,
          views: 1,
          category: 1,
        },
      }
    )
    .toArray()

  // 2) _id를 string으로 변환해서 클라이언트가 바로 사용할 수 있도록 매핑
  const result = files.map((f) => ({
    id: f._id.toString(),
    title: f.title,
    filename: f.filename,
    originalName: f.originalName,
    ownerName: f.ownerName,
    ownerAvatar: f.ownerAvatar,
    createdAt:
      f.createdAt instanceof Date ? f.createdAt.toISOString() : f.createdAt,
    isEncrypted: f.isEncrypted,
    isLocked: f.isLocked ?? false,
    views: f.views ?? 0,
    category: f.category,
  }))

  return NextResponse.json(result)
}
