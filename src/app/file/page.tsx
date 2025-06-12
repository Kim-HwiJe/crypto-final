'use client'

import React, { useState, useEffect, useMemo } from 'react'
import useSWR from 'swr'
import Image from 'next/image'
import Link from 'next/link'

type FileItem = {
  id: string
  title: string
  filename: string
  originalName: string
  ownerName: string
  ownerEmail: string
  createdAt: string
  isEncrypted: boolean
  isLocked: boolean
  views: number
  category: string
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const ICON_MAP: Record<string, string> = {
  음악: '/icons/audio.png',
  이미지: '/icons/image.png',
  영상: '/icons/video.png',
  텍스트: '/icons/file.png',
  게임: '/icons/game.png',
  소프트웨어: '/icons/software.png',
  기타: '/icons/etc.png',
}

export default function FileListPage() {
  const { data: files, error } = useSWR<FileItem[]>('/api/file', fetcher)

  const [selectedCat, setSelectedCat] = useState<string>('모두')
  const [sortKey, setSortKey] = useState<'latest' | 'popular' | 'alphabet'>(
    'latest'
  )
  const [currentPage, setCurrentPage] = useState<number>(1)
  const itemsPerPage = 9

  const cats = useMemo(() => {
    if (!files) return ['모두']
    const unique = Array.from(new Set(files.map((f) => f.category))).sort()
    return ['모두', ...unique]
  }, [files])

  const filtered = useMemo(() => {
    if (!files) return []
    if (selectedCat === '모두') return files
    return files.filter((f) => f.category === selectedCat)
  }, [files, selectedCat])

  const sorted = useMemo(() => {
    if (!filtered) return []
    const arr = [...filtered]
    if (sortKey === 'latest') {
      return arr.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
    }
    if (sortKey === 'popular') {
      return arr.sort((a, b) => b.views - a.views)
    }
    return arr.sort((a, b) => {
      const ta = a.title || a.originalName
      const tb = b.title || b.originalName
      return ta.localeCompare(tb, 'ko-KR')
    })
  }, [filtered, sortKey])

  const totalPages = useMemo(() => {
    return Math.ceil(sorted.length / itemsPerPage)
  }, [sorted])

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return sorted.slice(start, start + itemsPerPage)
  }, [sorted, currentPage])

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [currentPage, selectedCat, sortKey])

  if (error) {
    return <p className="p-6 text-red-500">에러가 발생했습니다.</p>
  }
  if (!files) {
    return <p className="p-6">로딩 중…</p>
  }

  return (
    <div className="flex max-w-7xl mx-auto px-6 py-8 gap-8">
      {/* Left: 카테고리 사이드바 */}
      <aside className="w-48 space-y-2">
        {cats.map((cat) => (
          <button
            key={cat}
            onClick={() => {
              setSelectedCat(cat)
              setCurrentPage(1)
            }}
            className={`w-full text-left px-3 py-2 rounded-lg border-l-4 font-medium ${
              selectedCat === cat
                ? 'border-purple-600 bg-purple-50 text-purple-600'
                : 'border-transparent text-gray-600 hover:bg-gray-100'
            }`}
          >
            {cat}
          </button>
        ))}
      </aside>

      {/* Right: 콘텐츠 영역 */}
      <div className="flex-1 space-y-6">
        {/* 정렬 옵션 */}
        <div className="flex justify-end items-center gap-2">
          <span className="text-gray-600">정렬:</span>
          <select
            value={sortKey}
            onChange={(e) => {
              setSortKey(e.target.value as any)
              setCurrentPage(1)
            }}
            className="border-gray-500 rounded px-2 py-1 text-sm text-gray-500"
          >
            <option value="latest">최신순</option>
            <option value="popular">인기순</option>
            <option value="alphabet">가나다순</option>
          </select>
        </div>

        {/* 파일 카드 그리드 */}
        <main className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginated.length > 0 ? (
            paginated.map((f) => <FileCard key={f.id} file={f} />)
          ) : (
            <p className="col-span-full text-center text-gray-500">
              해당 카테고리의 파일이 없습니다.
            </p>
          )}
        </main>

        {/* 페이지네이션 */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className={`px-3 py-1 rounded ${
                currentPage === 1
                  ? 'bg-gray-200 text-gray-400'
                  : 'bg-purple-600 text-white hover:bg-purple-700'
              }`}
            >
              이전
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
              <button
                key={num}
                onClick={() => setCurrentPage(num)}
                className={`px-3 py-1 rounded ${
                  currentPage === num
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {num}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className={`px-3 py-1 rounded ${
                currentPage === totalPages
                  ? 'bg-gray-200 text-gray-400'
                  : 'bg-purple-600 text-white hover:bg-purple-700'
              }`}
            >
              다음
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

interface FileCardProps {
  file: FileItem
}

const FileCard: React.FC<FileCardProps> = ({ file }) => {
  const [avatarUrl, setAvatarUrl] = useState<string>('/default-avatar.png')

  useEffect(() => {
    if (!file.ownerEmail) return

    fetch(`/api/user/avatar?email=${encodeURIComponent(file.ownerEmail)}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`status ${res.status}`)
        }
        return res.json()
      })
      .then((data: { avatarUrl?: string }) => {
        setAvatarUrl(data.avatarUrl || '/default-avatar.png')
      })
      .catch(() => {
        setAvatarUrl('/default-avatar.png')
      })
  }, [file.ownerEmail])

  const icon = ICON_MAP[file.category] || ICON_MAP['기타']

  return (
    <Link
      href={`/file/${file.id}`}
      className="block bg-white rounded-lg shadow hover:shadow-lg transition overflow-hidden"
    >
      {/* 썸네일 또는 카테고리 아이콘 */}
      <div className="h-48 w-full relative bg-gray-100 flex items-center justify-center">
        <Image
          src={icon}
          alt={`${file.category} 아이콘`}
          width={64}
          height={64}
          className="object-contain"
        />
      </div>

      <div className="p-4 space-y-2">
        {/* 제목 */}
        <h3 className="font-semibold text-lg line-clamp-2 text-gray-800">
          {file.title || file.originalName}
        </h3>

        {/* 업로더 */}
        <div className="flex items-center gap-2">
          <Image
            src={avatarUrl}
            alt={`${file.ownerName} 아바타`}
            width={24}
            height={24}
            style={{ width: '24px', height: '24px' }}
            className="rounded-full"
          />
          <span className="text-sm text-gray-700">{file.ownerName}</span>
          {file.isEncrypted && (
            <span className="ml-auto text-xs bg-yellow-200 text-yellow-800 px-2 py-0.5 rounded">
              암호화됨
            </span>
          )}
          {file.isLocked && (
            <span className="ml-0 text-xs bg-green-200 text-green-800 px-2 py-0.5 rounded">
              잠긴 파일
            </span>
          )}
        </div>

        {/* 업로드 일시 & 조회수 */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>
            {new Date(file.createdAt).toLocaleString('ko-KR', {
              dateStyle: 'short',
              timeStyle: 'short',
            })}
          </span>
          <span>👁 {file.views}</span>
        </div>
      </div>
    </Link>
  )
}
