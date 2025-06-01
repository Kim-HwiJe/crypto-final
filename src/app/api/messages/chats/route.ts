// src/app/api/messages/chats/route.ts
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

export const runtime = 'nodejs'

export async function GET() {
  // 1) 로그인된 사용자 확인
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
  const messagesCol = db.collection('messages')
  const usersCol = db.collection('users')
  const filesCol = db.collection('files')

  // 2) 나와 관련된 모든 메시지에서 (other, fileId) 쌍 수집
  const allMsgs = await messagesCol
    .find({ $or: [{ from: me }, { to: me }] })
    .project({ from: 1, to: 1, fileId: 1 })
    .toArray()

  const pairSet = new Set<string>()
  allMsgs.forEach((m) => {
    const other = m.from === me ? m.to : m.from
    if (other && m.fileId) {
      pairSet.add(`${other}|${m.fileId}`)
    }
  })
  const pairs = Array.from(pairSet).map((str) => {
    const [other, fileId] = str.split('|')
    return { other, fileId }
  })

  // 3) 상대 이메일과 파일 ID 리스트 (중복 제거)
  const otherEmails = Array.from(new Set(pairs.map((p) => p.other)))

  const rawFileIds = Array.from(new Set(pairs.map((p) => p.fileId)))
  // 유효한 ObjectId 문자열만 필터
  const validFileIds = rawFileIds.filter((id) => ObjectId.isValid(id))
  const fileObjectIds = validFileIds.map((id) => new ObjectId(id))

  // 4) 유저 정보 조회
  const users = await usersCol
    .find({ email: { $in: otherEmails } })
    .project({ email: 1, name: 1, avatarUrl: 1 })
    .toArray()
  const userMap = new Map(users.map((u) => [u.email, u]))

  // 5) 파일 정보 조회
  const files = await filesCol
    .find({ _id: { $in: fileObjectIds } })
    .project({ _id: 1, title: 1, originalName: 1 })
    .toArray()
  const fileMap = new Map(files.map((f) => [f._id.toString(), f]))

  // 6) ChatWithUser 구조로 조립
  type ChatRoom = {
    fileId: string
    title: string
    originalName: string
    unreadCount: number
  }
  type ChatWithUser = {
    userEmail: string
    userName: string
    avatarUrl: string
    rooms: ChatRoom[]
  }

  const chatMap = new Map<string, ChatWithUser>()

  for (const { other, fileId } of pairs) {
    // 6-1) 읽지 않은 메시지 개수
    const unreadCount = await messagesCol.countDocuments({
      from: other,
      to: me,
      fileId,
      read: { $ne: true },
    })

    // 6-2) 사용자별 객체 생성/가져오기
    let chat = chatMap.get(other)
    if (!chat) {
      const u = userMap.get(other)
      chat = {
        userEmail: other,
        userName: u?.name || other,
        avatarUrl: u?.avatarUrl || '/default-avatar.png',
        rooms: [],
      }
      chatMap.set(other, chat)
    }

    // 6-3) 방 정보 추가
    const f = fileMap.get(fileId)
    chat.rooms.push({
      fileId,
      title: f?.title || '제목 없음',
      originalName: f?.originalName || '이름 없음',
      unreadCount,
    })
  }

  // 7) 결과 반환
  return NextResponse.json(Array.from(chatMap.values()))
}
