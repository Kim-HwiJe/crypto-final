// src/app/user/me/page.tsx

import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import clientPromise from '@/lib/mongodb'
import Image from 'next/image'
import Link from 'next/link'
import { ObjectId } from 'mongodb'
import { Metadata } from 'next'

// 카테고리 → 아이콘 매핑
const ICON_MAP: Record<string, string> = {
  음악: '/icons/audio.png',
  이미지: '/icons/image.png',
  영상: '/icons/video.png',
  텍스트: '/icons/text.png',
  게임: '/icons/game.png',
  소프트웨어: '/icons/software.png',
  기타: '/icons/etc.png',
}

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

type UserInfo = {
  _id: ObjectId
  name: string
  email: string
  avatarUrl: string
}

export const metadata: Metadata = {
  title: '내 마이페이지',
}

export default async function MyPage() {
  // 1) 로그인 확인
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return (
      <div className="p-6 text-center text-red-500">로그인이 필요합니다.</div>
    )
  }
  const email = session.user.email

  // 2) DB 커넥션
  const client = await clientPromise

  // → users 는 'your-db-name' 에 있고
  const userDb = client.db('your-db-name')
  const user = await userDb.collection<UserInfo>('users').findOne({ email })

  if (!user) {
    return <div className="p-6 text-center">유저 정보를 찾을 수 없습니다.</div>
  }

  // → files 는 기본 DB (client.db()) 에 들어있으므로
  const fileDb = client.db() // 기본 DB
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

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 space-y-8">
      {/* 프로필 */}
      <div className="flex items-center gap-6 border-b pb-6">
        <Image
          src={user.avatarUrl || '/default-avatar.png'}
          alt="아바타"
          width={80}
          height={80}
          className="rounded-full border"
        />
        <div>
          <h1 className="text-2xl font-bold text-purple-500">{user.name}</h1>
          <p className="text-gray-500">{user.email}</p>
        </div>
      </div>

      {/* 내가 업로드한 파일들 */}
      <section>
        <h2 className="text-xl font-semibold mb-4 text-gray-400">
          내가 업로드한 파일들
        </h2>
        {fileItems.length === 0 ? (
          <p className="text-gray-500">아직 업로드한 파일이 없습니다.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {fileItems.map((f) => {
              const icon = ICON_MAP[f.category] || ICON_MAP['기타']
              return (
                <Link
                  key={f.id}
                  href={`/file/${f.id}`}
                  className="flex items-center bg-white rounded shadow hover:shadow-lg transition p-4"
                >
                  {/* 좌측 카테고리 아이콘 */}
                  <div className="flex-shrink-0">
                    <Image
                      src={icon}
                      alt={`${f.category} 아이콘`}
                      width={40}
                      height={40}
                      className="object-contain"
                    />
                  </div>
                  {/* 우측 내용 */}
                  <div className="ml-4 flex-1">
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
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
