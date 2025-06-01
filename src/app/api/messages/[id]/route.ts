// src/app/api/messages/[id]/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export const runtime = 'nodejs'

// ─────────────────────────────────────────────────────────────────────────────
// [PATCH] /api/messages/[id]
//   - 메시지 수정 (content만 업데이트)
// ─────────────────────────────────────────────────────────────────────────────
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // params는 Promise<{ id: string }>이므로 await로 해제
  const { id } = await params

  if (!ObjectId.isValid(id)) {
    return NextResponse.json(
      { message: '잘못된 메시지 ID입니다.' },
      { status: 400 }
    )
  }

  // 로그인 검사
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json(
      { message: '로그인이 필요합니다.' },
      { status: 401 }
    )
  }
  const me = session.user.email

  // 요청 바디에서 새 내용(content)만 받음
  const { content } = await request.json()
  if (typeof content !== 'string' || !content.trim()) {
    return NextResponse.json(
      { message: '내용이 비어있습니다.' },
      { status: 400 }
    )
  }

  const client = await clientPromise
  const db = client.db()
  const messagesColl = db.collection('messages')

  // 기존 메시지를 조회
  const existing = await messagesColl.findOne({ _id: new ObjectId(id) })
  if (!existing) {
    return NextResponse.json(
      { message: '메시지를 찾을 수 없습니다.' },
      { status: 404 }
    )
  }
  // 본인이 작성한 메시지인지 확인
  if (existing.from !== me) {
    return NextResponse.json(
      { message: '본인의 메시지만 수정할 수 있습니다.' },
      { status: 403 }
    )
  }

  // 업데이트: content와 edited 플래그, updatedAt 필드를 추가
  await messagesColl.updateOne(
    { _id: new ObjectId(id) },
    {
      $set: {
        content: content.trim(),
        edited: true,
        updatedAt: new Date(),
      },
    }
  )

  return NextResponse.json({ message: '메시지가 수정되었습니다.' })
}

// ─────────────────────────────────────────────────────────────────────────────
// [DELETE] /api/messages/[id]
//   - 메시지 삭제
// ─────────────────────────────────────────────────────────────────────────────
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  if (!ObjectId.isValid(id)) {
    return NextResponse.json(
      { message: '잘못된 메시지 ID입니다.' },
      { status: 400 }
    )
  }

  // 로그인 검사
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json(
      { message: '로그인이 필요합니다.' },
      { status: 401 }
    )
  }
  const me = session.user.email

  const client = await clientPromise
  const db = client.db()
  const messagesColl = db.collection('messages')

  // 삭제하려는 메시지를 조회
  const existing = await messagesColl.findOne({ _id: new ObjectId(id) })
  if (!existing) {
    return NextResponse.json(
      { message: '메시지를 찾을 수 없습니다.' },
      { status: 404 }
    )
  }
  // 본인이 쓴 메시지인지 확인
  if (existing.from !== me) {
    return NextResponse.json(
      { message: '본인의 메시지만 삭제할 수 있습니다.' },
      { status: 403 }
    )
  }

  // 실제 삭제
  await messagesColl.deleteOne({ _id: new ObjectId(id) })
  return NextResponse.json({ message: '메시지가 삭제되었습니다.' })
}
