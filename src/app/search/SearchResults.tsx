// src/app/search/SearchResults.tsx
'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import toast from 'react-hot-toast'

// 유저 정보 타입
interface UserInfo {
  _id: string
  email: string
  name: string
  avatarUrl?: string
}

// 파일 결과 타입
interface FileInfo {
  id: string
  _id?: string
  title: string
  originalName: string
  ownerName: string
  ownerAvatar: string
  createdAt: string
  isEncrypted: boolean
  isLocked: boolean
  views: number
  category: string
}

const ICON_MAP: Record<string, string> = {
  음악: '/icons/audio.png',
  이미지: '/icons/image.png',
  영상: '/icons/video.png',
  텍스트: '/icons/file.png',
  게임: '/icons/game.png',
  소프트웨어: '/icons/software.png',
  기타: '/icons/etc.png',
}

export default function SearchResults() {
  const searchParams = useSearchParams()
  const query = searchParams.get('query')
  const type = searchParams.get('type')

  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')

  // 페이지네이션 상태
  const [page, setPage] = useState(1)
  const pageSize = 9
  const totalPages = Math.ceil(results.length / pageSize)

  useEffect(() => {
    if (!query || !type) return

    setLoading(true)
    setError('')

    fetch(`/api/search?query=${encodeURIComponent(query)}&type=${type}`)
      .then((res) => res.json())
      .then((data) => {
        setLoading(false)
        if (data.results) {
          setResults(data.results)
          setPage(1)
        } else {
          setError(
            `"${query}"에 해당하는 ${
              type === 'user' ? '사용자' : '파일'
            }가 없습니다.`
          )
        }
      })
      .catch(() => {
        setLoading(false)
        setError('검색 중 오류가 발생했습니다.')
      })
  }, [query, type])

  const paginated = results.slice((page - 1) * pageSize, page * pageSize)

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-8">
      <h1 className="text-2xl font-bold text-gray-800">검색 결과</h1>

      {loading && <p>검색 중…</p>}
      {error && <p className="text-red-500">{error}</p>}

      {/* 사용자 검색 결과 */}
      {type === 'user' && paginated.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold mb-4 text-gray-500">
            사용자 검색 결과
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {paginated.map((user: UserInfo) => (
              <Link
                key={user.email}
                href={`/user/${encodeURIComponent(user.email)}`}
                className="flex flex-col items-center bg-white p-3 rounded shadow hover:shadow-lg transition"
              >
                <Image
                  src={user.avatarUrl || '/default-avatar.png'}
                  alt={`${user.name} 아바타`}
                  width={48}
                  height={48}
                  className="rounded-full"
                />
                <span className="mt-2 text-sm font-medium text-gray-800">
                  {user.name}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 파일 검색 결과 */}
      {type === 'file' && paginated.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold mb-4 text-gray-500">
            파일 검색 결과
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginated.map((file: FileInfo) => {
              const fileId = file.id ?? file._id!
              const icon = ICON_MAP[file.category] || ICON_MAP['기타']
              return (
                <Link
                  key={fileId}
                  href={`/file/${fileId}`}
                  className="block bg-white rounded-lg shadow hover:shadow-lg transition overflow-hidden"
                >
                  <div className="h-32 w-full bg-gray-100 flex items-center justify-center">
                    <Image
                      src={icon}
                      alt={`${file.category} 아이콘`}
                      width={40}
                      height={40}
                      className="object-contain"
                    />
                  </div>
                  <div className="p-3 space-y-1 text-sm">
                    <h3 className="font-semibold line-clamp-2 text-gray-800">
                      {file.title || file.originalName}
                    </h3>
                    <p className="text-gray-500">{file.originalName}</p>
                    <div className="flex items-center gap-2">
                      <Image
                        src={file.ownerAvatar}
                        alt={`${file.ownerName} 아바타`}
                        width={20}
                        height={20}
                        className="rounded-full"
                      />
                      <span className="text-gray-700">{file.ownerName}</span>
                      {file.isEncrypted && (
                        <span className="ml-auto text-xs bg-yellow-200 text-yellow-800 px-2 py-0.5 rounded">
                          암호화
                        </span>
                      )}
                      {file.isLocked && (
                        <span className="text-xs bg-green-200 text-green-800 px-2 py-0.5 rounded">
                          잠김
                        </span>
                      )}
                    </div>
                    <div className="flex justify-between text-gray-500">
                      <span className="text-xs">
                        {new Date(file.createdAt).toLocaleString('ko-KR', {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })}
                      </span>
                      <span className="text-xs">👁 {file.views}</span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {/* 결과 없을 경우 */}
      {!loading && !error && paginated.length === 0 && (
        <p className="text-gray-500">검색 결과가 없습니다.</p>
      )}

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <nav className="flex justify-center items-center space-x-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1 bg-gray-400 rounded disabled:opacity-50"
          >
            이전
          </button>
          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i + 1}
              onClick={() => setPage(i + 1)}
              className={`px-3 py-1 rounded ${
                page === i + 1
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-400 hover:bg-gray-600'
              }`}
            >
              {i + 1}
            </button>
          ))}
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1 bg-gray-400 rounded disabled:opacity-50"
          >
            다음
          </button>
        </nav>
      )}
    </div>
  )
}
