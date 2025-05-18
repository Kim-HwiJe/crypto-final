// src/app/user/[userId]/page.tsx

import { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

// — 사용자 정보 타입
type UserInfo = {
  _id: ObjectId
  name: string
  email: string
  avatarUrl: string
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
  // Next.js 가 넘겨주는 params 는 Promise 안에 들어 있으니 Promise<...> 로 타입 지정
  params: Promise<{ userId: string }>
}

/**
 * 페이지 메타 (동적 title)
 */
export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { userId } = await params
  const email = decodeURIComponent(userId)
  return { title: `프로필 – ${email}` }
}

/**
 * 프로필 페이지 자체
 */
export default async function UserPage({ params }: PageProps) {
  // 1) params 풀어내기
  const { userId } = await params
  const email = decodeURIComponent(userId)

  // 2) 내 세션 (내 페이지인지 확인)
  const session = await getServerSession(authOptions)
  const me = session?.user?.email

  // 3) DB에서 유저 정보 (your-db-name.users)
  const client = await clientPromise
  const userDb = client.db('your-db-name')
  const user = await userDb.collection<UserInfo>('users').findOne({ email })
  if (!user) {
    return (
      <div className="p-6 text-center text-red-500">
        존재하지 않는 사용자입니다.
      </div>
    )
  }

  // 4) 기본 DB.files 에서 업로드한 파일들
  const fileDb = client.db()
  const files = await fileDb
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

  const isMyPage = me === email

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
        <div>
          <h1 className="text-2xl font-bold text-purple-600">{user.name}</h1>
          <p className="text-gray-500">{user.email}</p>
        </div>
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
                {/* 카테고리 아이콘 */}
                <div className="flex-shrink-0">
                  <Image
                    src={ICON_MAP[f.category] || ICON_MAP['기타']}
                    alt={`${f.category} 아이콘`}
                    width={40}
                    height={40}
                  />
                </div>

                {/* 파일 정보 */}
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
    </div>
  )
}
