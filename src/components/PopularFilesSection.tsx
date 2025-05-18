// src/components/PopularFilesSection.tsx
'use client'

import Image from 'next/image'
import Link from 'next/link'
import React, { useState } from 'react'

interface FileCard {
  id: string
  avatar: string
  ownerName: string
  title: string
  subtitle: string
  category: string
  views: number
  originalName: string
}

interface Props {
  files: FileCard[]
  categories: string[]
}

const ICON_MAP: Record<string, string> = {
  음악: '/icons/music.png',
  이미지: '/icons/image.png',
  영상: '/icons/video.png',
  텍스트: '/icons/text.png',
  게임: '/icons/game.png',
  소프트웨어: '/icons/software.png',
  기타: '/icons/etc.png',
}

const PopularFilesSection: React.FC<Props> = ({ files, categories }) => {
  const [selectedCat, setSelectedCat] = useState<string>('전체')

  // 필터링
  const filtered =
    selectedCat === '전체'
      ? files
      : files.filter((f) => f.category === selectedCat)

  return (
    <section className="space-y-6">
      <h2 className="text-3xl font-semibold text-purple-600 text-center">
        인기 있는 파일들
      </h2>
      <div className="flex flex-wrap justify-center gap-3">
        <button
          onClick={() => setSelectedCat('전체')}
          className={`px-4 py-1 rounded-full text-sm font-medium ${
            selectedCat === '전체'
              ? 'bg-purple-100 text-purple-600'
              : 'bg-gray-100 text-gray-600'
          }`}
        >
          전체
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCat(cat)}
            className={`px-4 py-1 rounded-full text-sm font-medium ${
              selectedCat === cat
                ? 'bg-purple-100 text-purple-600'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {filtered.length === 0 && (
          <div className="col-span-full text-center text-gray-400 py-10">
            해당 카테고리의 파일이 없습니다.
          </div>
        )}
        {filtered.map((file) => {
          // 파일 형식별 아이콘 선택
          const icon = ICON_MAP[file.category] || ICON_MAP['기타']
          return (
            <div
              key={file.id}
              className="bg-white shadow-md rounded-lg overflow-hidden"
            >
              {/* 아이콘 표시 */}
              <div className="h-40 bg-gray-200 flex items-center justify-center">
                <Image
                  src={icon}
                  alt={`${file.category} 아이콘`}
                  width={64}
                  height={64}
                  className="object-contain"
                />
              </div>
              <div className="p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <Image
                    src={file.avatar || '/avatars/default.png'}
                    alt="avatar"
                    width={40}
                    height={40}
                    className="rounded-full"
                  />
                  <div>
                    <h3 className="font-semibold text-gray-800">
                      {file.title}
                    </h3>
                    <span className="text-sm text-gray-700">
                      {file.ownerName}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-gray-600">{file.subtitle}</p>
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>👁 {file.views} 조회수</span>
                  <Link href={`/file/${file.id}`}>
                    <button className="text-purple-600 hover:underline">
                      Details
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

export default PopularFilesSection
