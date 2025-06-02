// src/components/PopularFilesSection.tsx
'use client'

import Image from 'next/image'
import Link from 'next/link'
import React, { useState, useMemo, useEffect } from 'react'

interface FileCard {
  id: string
  ownerId: string // 유저 이메일을 여기 ownerId에 넣어둡니다.
  ownerName: string
  title: string
  subtitle: string
  category: string
  views: number
}

interface Props {
  files: FileCard[]
  categories: string[]
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

const PopularFilesSection: React.FC<Props> = ({ files, categories }) => {
  const [selectedCat, setSelectedCat] = useState<string>('전체')

  // 전체일 때 조회수 상위 3개, 그 외엔 해당 카테고리 전체
  const filtered = useMemo(() => {
    if (selectedCat === '전체') {
      return [...files].sort((a, b) => b.views - a.views).slice(0, 3)
    }
    return files.filter((f) => f.category === selectedCat)
  }, [selectedCat, files])

  return (
    <section className="space-y-6">
      <h2 className="text-3xl font-semibold text-purple-600 text-center">
        인기 있는 파일들
      </h2>

      {/* 카테고리 탭 */}
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

      {/* 파일 카드 그리드 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {filtered.length === 0 ? (
          <div className="col-span-full text-center text-gray-400 py-10">
            해당 카테고리의 파일이 없습니다.
          </div>
        ) : (
          filtered.map((file) => <FileCardItem key={file.id} file={file} />)
        )}
      </div>
    </section>
  )
}

interface FileCardItemProps {
  file: FileCard
}

const FileCardItem: React.FC<FileCardItemProps> = ({ file }) => {
  // 초기값은 기본 아바타로 설정
  const [avatarUrl, setAvatarUrl] = useState<string>('/default-avatar.png')

  useEffect(() => {
    const fetchAvatar = async () => {
      try {
        // 새로 만든 API 호출 (이메일을 쿼리로 넘김)
        const res = await fetch(
          `/api/user/avatar?email=${encodeURIComponent(file.ownerId)}`
        )
        if (!res.ok) {
          throw new Error('아바타를 가져오는 데 실패했습니다.')
        }
        const data = (await res.json()) as { avatarUrl?: string }
        setAvatarUrl(data.avatarUrl ?? '/default-avatar.png')
      } catch (err) {
        console.error('아바타 로딩 오류:', err)
      }
    }
    fetchAvatar()
  }, [file.ownerId])

  const icon = ICON_MAP[file.category] || ICON_MAP['기타']

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
      {/* 파일 아이콘 */}
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
        {/* 업로더 정보 (최신 아바타) */}
        <div className="flex items-center gap-3">
          <Image
            src={avatarUrl}
            alt="uploader avatar"
            width={40}
            height={40}
            className="rounded-full"
          />
          <div>
            <h3 className="font-semibold text-gray-800">{file.title}</h3>
            <span className="text-sm text-gray-700">{file.ownerName}</span>
          </div>
        </div>

        {/* 간단 설명 */}
        <p className="text-sm text-gray-600">{file.subtitle}</p>

        {/* 메타: 조회수 & 상세보기 */}
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>👁 {file.views} 조회수</span>
          <Link href={`/file/${file.id}`}>
            <button className="text-purple-600 hover:underline">Details</button>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default PopularFilesSection
