// src/app/files/page.tsx
'use client'

import React, { useState } from 'react'
import useSWR from 'swr'
import Image from 'next/image'
import Link from 'next/link'

type FileItem = {
  id: string
  title: string
  filename: string
  originalName: string
  ownerName: string
  ownerAvatar: string
  createdAt: string
  isEncrypted: boolean
  isLocked: boolean // ← 잠금 여부
  views: number
  category: string
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

// 카테고리 → 아이콘 매핑
const ICON_MAP: Record<string, string> = {
  음악: '/icons/music.png',
  이미지: '/icons/image.png',
  영상: '/icons/video.png',
  텍스트: '/icons/text.png',
  게임: '/icons/game.png',
  소프트웨어: '/icons/software.png',
  기타: '/icons/etc.png',
}

export default function FileListPage() {
  const { data: files, error } = useSWR<FileItem[]>('/api/file', fetcher)
  const [selectedCat, setSelectedCat] = useState<string>('모두')

  if (error) return <p className="p-6 text-red-500">에러가 발생했습니다.</p>
  if (!files) return <p className="p-6">로딩 중…</p>

  const cats = Array.from(new Set(files.map((f) => f.category))).sort()
  cats.unshift('모두')

  const filtered =
    selectedCat === '모두'
      ? files
      : files.filter((f) => f.category === selectedCat)

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 flex gap-8">
      {/* Left: 카테고리 */}
      <aside className="w-48 space-y-2 text-gray-500">
        {cats.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCat(cat)}
            className={`w-full text-left px-3 py-2 rounded-lg border ${
              selectedCat === cat
                ? 'border-purple-600 bg-purple-50 text-purple-600'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            {cat}
          </button>
        ))}
      </aside>

      {/* Right: 파일 카드 그리드 */}
      <main className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((f) => {
          const icon = ICON_MAP[f.category] || ICON_MAP['기타']
          return (
            <Link
              key={f.id}
              href={`/file/${f.id}`}
              className="block bg-white rounded-lg shadow hover:shadow-lg transition overflow-hidden"
            >
              {/* 썸네일 또는 카테고리 아이콘 */}
              <div className="h-48 w-full relative bg-gray-100 flex items-center justify-center">
                <Image
                  src={icon}
                  alt={`${f.category} 아이콘`}
                  width={64}
                  height={64}
                  className="object-contain"
                />
              </div>

              <div className="p-4 space-y-2">
                {/* 제목 */}
                <h3 className="font-semibold text-lg line-clamp-2 text-gray-800">
                  {f.title || f.originalName}
                </h3>

                {/* 업로더 */}
                <div className="flex items-center gap-2">
                  <Image
                    src={f.ownerAvatar}
                    alt={`${f.ownerName} 아바타`}
                    width={24}
                    height={24}
                    className="rounded-full"
                  />
                  <span className="text-sm text-gray-700">{f.ownerName}</span>
                  {/* 암호화 배지 */}
                  {f.isEncrypted && (
                    <span className="ml-auto text-xs bg-yellow-200 text-yellow-800 px-2 py-0.5 rounded">
                      암호화됨
                    </span>
                  )}
                  {/* 잠금 배지 */}
                  {f.isLocked && (
                    <span className="ml-0 text-xs bg-green-200 text-green-800 px-2 py-0.5 rounded">
                      잠긴 파일
                    </span>
                  )}
                </div>

                {/* 메타: 업로드 일시 & 조회수 */}
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>
                    {new Date(f.createdAt).toLocaleString('ko-KR', {
                      dateStyle: 'short',
                      timeStyle: 'short',
                    })}
                  </span>
                  <span>👁 {f.views}</span>
                </div>
              </div>
            </Link>
          )
        })}

        {filtered.length === 0 && (
          <p className="col-span-full text-center text-gray-500">
            해당 카테고리의 파일이 없습니다.
          </p>
        )}
      </main>
    </div>
  )
}
