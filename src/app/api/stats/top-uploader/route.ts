// 파일 경로: src/app/api/stats/top-uploader/route.ts

import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'

/**
 * GET /api/stats/top-uploader
 * App Router 방식으로 변환된 코드입니다.
 */
export async function GET() {
  try {
    // 1) 기본(“디폴트”) 데이터베이스에서 files 컬렉션을 조회하여 ownerEmail별 업로드 수를 집계
    const client = await clientPromise
    const defaultDb = client.db() // 기본 DB (MongoDB 연결 시 설정된 기본 DB)
    const filesColl = defaultDb.collection('files')

    const topAggregation = await filesColl
      .aggregate([
        // ownerEmail 별로 그룹핑하여 count 합산
        { $group: { _id: '$ownerEmail', count: { $sum: 1 } } },
        // 업로드 건수 기준 내림차순 정렬
        { $sort: { count: -1 } },
        // 최상위 1개만 가져오기
        { $limit: 1 },
      ])
      .toArray()

    // 만약 업로드된 파일이 하나도 없을 경우
    if (!topAggregation || topAggregation.length === 0) {
      return NextResponse.json({ name: '없음', count: 0 }, { status: 200 })
    }

    const topEntry = topAggregation[0]
    const userEmail = topEntry._id as string
    const count = topEntry.count as number

    // 2) “your-db-name” DB에서 users 컬렉션을 조회하여 해당 이메일 사용자의 이름을 가져옴
    const usersDb = client.db('your-db-name')
    const usersColl = usersDb.collection('users')

    const userDoc = await usersColl.findOne(
      { email: userEmail },
      { projection: { name: 1 } }
    )

    // 사용자가 존재하지 않으면 이메일 그 자체를 이름으로 출력
    const name = userDoc?.name || userEmail

    return NextResponse.json({ name, count }, { status: 200 })
  } catch (err) {
    console.error('[GET /api/stats/top-uploader] 오류:', err)
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
}
