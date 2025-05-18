// utils/getPopularFilesByCategory.ts
import clientPromise from '@/lib/mongodb'

export async function getPopularFilesAll(categories: string[]) {
  const client = await clientPromise
  const db = client.db()

  // 카테고리별 인기 파일 3개씩
  const allFiles: any[] = []

  for (const category of categories) {
    const files = await db
      .collection('files')
      .find({ category })
      .sort({ views: -1, createdAt: -1 })
      .limit(3)
      .toArray()
    for (const doc of files) {
      allFiles.push({
        id: doc._id.toString(),
        avatar: doc.ownerAvatar,
        ownerName: doc.ownerName,
        title: doc.title,
        subtitle: doc.description,
        category: doc.category,
        views: doc.views ?? 0,
        banner: '/banners/default.jpg',
        originalName: doc.originalName,
      })
    }
  }
  return allFiles
}
