// src/app/api/messages/[id]/route.ts

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export const runtime = 'nodejs'

// ─────────────────────────────────────────────────────────────
// PATCH: 메시지 수정
// ─────────────────────────────────────────────────────────────
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  // ① params를 await 해서 추출
  const { id } = await params
  if (!ObjectId.isValid(id)) {
    return NextResponse.json(
      { message: '잘못된 메시지 ID입니다.' },
      { status: 400 }
    )
  }

  // ② 로그인 검사
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json(
      { message: '로그인이 필요합니다.' },
      { status: 401 }
    )
  }
  const me = session.user.email

  // ③ 요청 바디 파싱
  const { content } = await req.json()
  if (!content || typeof content !== 'string') {
    return NextResponse.json(
      { message: '수정할 content가 필요합니다.' },
      { status: 400 }
    )
  }

  const client = await clientPromise
  const db = client.db()

  // ④ 메시지 존재 여부 및 작성자 확인
  const msgDoc = await db
    .collection('messages')
    .findOne({ _id: new ObjectId(id) })
  if (!msgDoc) {
    return NextResponse.json(
      { message: '메시지를 찾을 수 없습니다.' },
      { status: 404 }
    )
  }
  if (msgDoc.from !== me) {
    return NextResponse.json(
      { message: '수정 권한이 없습니다.' },
      { status: 403 }
    )
  }

  // ⑤ 메시지 수정 (edited=true, updatedAt 추가)
  await db.collection('messages').updateOne(
    { _id: msgDoc._id },
    {
      $set: {
        content: content.trim(),
        edited: true,
        updatedAt: new Date(),
      },
    }
  )

  // ⑥ 수정된 메시지 리턴
  return NextResponse.json({
    id,
    author: 'me',
    content: content.trim(),
    timestamp: new Date().toISOString(),
    edited: true,
  })
}

// ─────────────────────────────────────────────────────────────
// DELETE: 메시지 삭제
// ─────────────────────────────────────────────────────────────
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  // ① params를 await 해서 추출
  const { id } = await params
  if (!ObjectId.isValid(id)) {
    return NextResponse.json(
      { message: '잘못된 메시지 ID입니다.' },
      { status: 400 }
    )
  }

  // ② 로그인 검사
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

  // ③ 메시지 존재 여부 및 작성자 확인
  const msgDoc = await db
    .collection('messages')
    .findOne({ _id: new ObjectId(id) })
  if (!msgDoc) {
    return NextResponse.json(
      { message: '메시지를 찾을 수 없습니다.' },
      { status: 404 }
    )
  }
  if (msgDoc.from !== me) {
    return NextResponse.json(
      { message: '삭제 권한이 없습니다.' },
      { status: 403 }
    )
  }

  // ④ 메시지 삭제
  await db.collection('messages').deleteOne({ _id: msgDoc._id })

  return NextResponse.json({ message: '메시지가 삭제되었습니다.', id })
}
