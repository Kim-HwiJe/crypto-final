import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('query') || ''
  const type = searchParams.get('type') || 'user'

  if (!query) {
    return NextResponse.json(
      { message: '검색어가 필요합니다.' },
      { status: 400 }
    )
  }

  const client = await clientPromise
  const userDb = client.db('your-db-name')

  if (type === 'user') {
    const users = await userDb
      .collection('users')
      .find({ name: { $regex: query, $options: 'i' } })
      .toArray()

    return NextResponse.json({ results: users })
  } else if (type === 'file') {
    const files = await client
      .db()
      .collection('files')
      .find({ title: { $regex: query, $options: 'i' } })
      .toArray()

    return NextResponse.json({ results: files })
  }

  return NextResponse.json(
    { message: '유효하지 않은 검색 유형입니다.' },
    { status: 400 }
  )
}
