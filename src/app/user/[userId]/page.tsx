// src/app/user/[userId]/page.tsx

import { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import FollowButton from '@/components/FollowButton'

// — 사용자 정보 타입
type UserInfo = {
  _id: ObjectId
  name: string
  email: string
  avatarUrl: string
  description?: string // 설명 필드 추가
}

// — 파일 목록 항목 타입
type FileItem = {
  id: string
  title: string
  originalName: string
  createdAt: string
  views: number
  category: string
  isEncrypted: boolean
  isLocked: boolean
}

// — 카테고리 → 아이콘 매핑
const ICON_MAP: Record<string, string> = {
  음악: '/icons/audio.png',
  이미지: '/icons/image.png',
  영상: '/icons/video.png',
  텍스트: '/icons/file.png',
  게임: '/icons/game.png',
  소프트웨어: '/icons/software.png',
  기타: '/icons/etc.png',
}

interface PageProps {
  params: Promise<{ userId: string }>
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { userId } = await params
  const email = decodeURIComponent(userId)
  return { title: `프로필 – ${email}` }
}

export default async function UserPage({ params }: PageProps) {
  // 1) URL params 에서 email 꺼내기
  const { userId } = await params
  const email = decodeURIComponent(userId)

  // 2) 내 세션 조회 (내 페이지인지 확인)
  const session = await getServerSession(authOptions)
  const me = session?.user?.email
  const isMyPage = me === email

  // 3) DB 커넥션
  const client = await clientPromise
  const userDb = client.db('your-db-name')

  // 4) 사용자 정보 조회
  const user = await userDb
    .collection<UserInfo>('users')
    .findOne({ email }, { projection: { password: 0 } })
  if (!user) {
    return (
      <div className="p-6 text-center text-red-500">
        존재하지 않는 사용자입니다.
      </div>
    )
  }

  // 5) 내가 업로드한 파일들 조회 (기본 DB.files)
  const files = await client
    .db()
    .collection('files')
    .find({ ownerEmail: email })
    .sort({ createdAt: -1 })
    .toArray()

  const fileItems: FileItem[] = files.map((f: any) => ({
    id: f._id.toString(),
    title: f.title || f.originalName,
    originalName: f.originalName,
    createdAt: f.createdAt.toISOString(),
    views: f.views ?? 0,
    category: f.category,
    isEncrypted: f.isEncrypted,
    isLocked: f.isLocked,
  }))

  // 6) (본인 페이지인 경우) follows 컬렉션에서 내가 팔로우한 이메일 목록 가져오기
  let followUsers: UserInfo[] = []
  if (isMyPage) {
    const followDocs = await client
      .db() // 기본 DB
      .collection<{ follower: string; following: string }>('follows')
      .find({ follower: email })
      .toArray()

    const followingEmails = followDocs.map((d) => d.following)

    if (followingEmails.length) {
      followUsers = await userDb
        .collection<UserInfo>('users')
        .find(
          { email: { $in: followingEmails } },
          { projection: { password: 0 } }
        )
        .toArray()
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 space-y-8">
      {/* 프로필 헤더 */}
      <div className="flex items-center gap-6 border-b pb-6">
        <Image
          src={user.avatarUrl || '/default-avatar.png'}
          alt="아바타"
          width={80}
          height={80}
          className="rounded-full border"
        />
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-purple-600">{user.name}</h1>
          <p className="text-gray-500">{user.email}</p>
          {/* 설명이 있을 경우만 표시 */}
          {user.description && (
            <p className="mt-2 text-sm text-gray-600">{user.description}</p>
          )}
        </div>
        {/* 내 페이지가 아니면 팔로우 버튼 */}
        {!isMyPage && <FollowButton targetEmail={email} />}
      </div>

      {/* 업로드 파일 리스트 */}
      <section>
        <h2 className="text-xl font-semibold mb-4 text-gray-400">
          {isMyPage
            ? '내가 업로드한 파일들'
            : `${user.name}님이 업로드한 파일들`}
        </h2>

        {fileItems.length === 0 ? (
          <p className="text-gray-500">
            {isMyPage
              ? '아직 업로드한 파일이 없습니다.'
              : '해당 사용자가 업로드한 파일이 없습니다.'}
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {fileItems.map((f) => (
              <Link
                key={f.id}
                href={`/file/${f.id}`}
                className="flex items-center bg-white rounded shadow hover:shadow-lg transition p-4 space-x-4"
              >
                <div className="flex-shrink-0">
                  <Image
                    src={ICON_MAP[f.category] || ICON_MAP['기타']}
                    alt={`${f.category} 아이콘`}
                    width={40}
                    height={40}
                  />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800">{f.title}</h3>
                  <p className="text-sm text-gray-500">{f.originalName}</p>
                  <div className="mt-2 flex items-center text-xs text-gray-400 space-x-2">
                    <span>{f.category}</span>
                    <span>
                      · {new Date(f.createdAt).toLocaleDateString('ko-KR')}
                    </span>
                    <span>👁 {f.views}</span>
                    {f.isEncrypted && (
                      <span className="bg-yellow-200 text-yellow-800 px-2 py-0.5 rounded">
                        암호화됨
                      </span>
                    )}
                    {f.isLocked && (
                      <span className="bg-green-200 text-green-800 px-2 py-0.5 rounded">
                        잠김
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* 내가 팔로우한 사용자 (본인 페이지일 때만) */}
      {isMyPage && (
        <section>
          <h2 className="text-xl font-semibold mb-4 text-gray-400">
            내가 팔로우한 사용자
          </h2>
          {followUsers.length === 0 ? (
            <p className="text-gray-500">아직 팔로우한 사용자가 없습니다.</p>
          ) : (
            <div className="flex flex-wrap gap-6">
              {followUsers.map((u) => (
                <Link
                  key={u._id.toString()}
                  href={`/user/${encodeURIComponent(u.email)}`}
                  className="flex flex-col items-center space-y-2 bg-white p-4 rounded shadow hover:shadow-lg transition w-32"
                >
                  <Image
                    src={u.avatarUrl || '/default-avatar.png'}
                    alt={`${u.name} 아바타`}
                    width={64}
                    height={64}
                    className="rounded-full"
                  />
                  <span className="text-sm font-medium text-gray-800">
                    {u.name}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  )
}
