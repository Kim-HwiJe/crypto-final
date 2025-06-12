import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'

export async function GET() {
  try {
    const client = await clientPromise
    const defaultDb = client.db()
    const filesColl = defaultDb.collection('files')

    const topAggregation = await filesColl
      .aggregate([
        { $group: { _id: '$ownerEmail', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 1 },
      ])
      .toArray()

    if (!topAggregation || topAggregation.length === 0) {
      return NextResponse.json({ name: '없음', count: 0 }, { status: 200 })
    }

    const topEntry = topAggregation[0]
    const userEmail = topEntry._id as string
    const count = topEntry.count as number

    const usersDb = client.db('your-db-name')
    const usersColl = usersDb.collection('users')

    const userDoc = await usersColl.findOne(
      { email: userEmail },
      { projection: { name: 1 } }
    )
    const name = userDoc?.name || userEmail

    return NextResponse.json({ name, count }, { status: 200 })
  } catch (err) {
    console.error('[GET /api/stats/top-uploader] 오류:', err)
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
}
