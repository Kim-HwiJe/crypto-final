import clientPromise from '@/lib/mongodb'

export interface FileCard {
  id: string
  ownerEmail: string
  ownerName: string
  title: string
  subtitle: string
  category: string
  views: number
  banner: string
  originalName: string
}

export async function getPopularFilesAll(
  categories: string[]
): Promise<FileCard[]> {
  const client = await clientPromise
  const db = client.db()

  const allFiles: FileCard[] = []

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
        ownerEmail: doc.ownerEmail,
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
