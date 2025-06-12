import { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'

const ICON_MAP: Record<string, string> = {
  음악: '/icons/audio.png',
  이미지: '/icons/image.png',
  영상: '/icons/video.png',
  텍스트: '/icons/file.png',
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
  description: string | null
}

export const metadata: Metadata = {
  title: '내 마이페이지',
}

export default async function MyPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return (
      <div className="p-6 text-center text-red-500">
        로그인 후에 이용할 수 있습니다.
      </div>
    )
  }
  const email = session.user.email

  const client = await clientPromise

  const userDb = client.db('your-db-name')
  const user = await userDb
    .collection<UserInfo>('users')
    .findOne({ email }, { projection: { password: 0 } })
  if (!user) {
    return (
      <div className="p-6 text-center text-red-500">
        유저 정보를 찾을 수 없습니다.
      </div>
    )
  }

  const followDocs = await client
    .db()
    .collection<{ follower: string; following: string }>('follows')
    .find({ follower: email })
    .toArray()
  const followingEmails = followDocs.map((d) => d.following)

  const followUsers: UserInfo[] = followingEmails.length
    ? await userDb
        .collection<UserInfo>('users')
        .find(
          { email: { $in: followingEmails } },
          { projection: { password: 0 } }
        )
        .toArray()
    : []
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

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 space-y-12">
      {/* 프로필 헤더 */}
      <div className="flex items-center gap-6 border-b pb-6">
        <Image
          src={user.avatarUrl || '/avatars/default.png'}
          alt="아바타"
          width={80}
          height={80}
          className="rounded-full border"
        />
        <div>
          <h1 className="text-2xl font-bold text-purple-600">{user.name}</h1>
          <p className="text-gray-500">{user.email}</p>
          {user.description && (
            <p className="text-sm text-gray-500 mt-2">{user.description}</p>
          )}
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

      {/* 내가 팔로우한 사용자 */}
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
                  src={u.avatarUrl || '/avatars/default.png'}
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
    </div>
  )
}
