// src/app/api/file/route.ts
import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'

export const runtime = 'nodejs'

export async function GET() {
  const client = await clientPromise
  const filesColl = client.db().collection('files')

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
          isLocked: 1, // ← 추가
          views: 1,
          category: 1,
        },
      }
    )
    .toArray()

  return NextResponse.json(
    files.map((f) => ({
      id: f._id.toString(),
      title: f.title,
      filename: f.filename,
      originalName: f.originalName,
      ownerName: f.ownerName,
      ownerAvatar: f.ownerAvatar,
      createdAt: f.createdAt.toISOString(),
      isEncrypted: f.isEncrypted,
      isLocked: f.isLocked ?? false, // ← 추가
      views: f.views ?? 0,
      category: f.category,
    }))
  )
}
