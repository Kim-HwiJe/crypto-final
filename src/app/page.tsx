import Image from 'next/image'
import Link from 'next/link'
import React from 'react'
import { getPopularFilesAll } from '@/utils/getPopularFilesByCategory'
import PopularFilesSection from '@/components/PopularFilesSection'

export const dynamic = 'force-dynamic'

const categories = [
  '음악',
  '이미지',
  '영상',
  '텍스트',
  '게임',
  '소프트웨어',
  '기타',
]

const HomePage = async () => {
  const files = await getPopularFilesAll(categories)
  return (
    <div className="px-6 py-12 max-w-7xl mx-auto space-y-16">
      {/* Hero Section */}
      <section className="text-center space-y-4">
        <h1 className="text-4xl md:text-5xl font-bold text-purple-600">
          Welcome to SafeShare!
        </h1>
        <p className="text-gray-700">
          <span className="font-semibold text-purple-600">SafeShare</span> |
          안전한 파일 공유 시스템
        </p>
        <p className="text-gray-500 max-w-2xl mx-auto">
          암호화를 통해 안전하게 파일을 공유해 보세요!
        </p>
        <div className="flex justify-center gap-4 pt-4">
          <Link href="/upload">
            <button className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-md font-medium transition">
              Upload⚡
            </button>
          </Link>
          <Link href="/signup">
            <button className="bg-purple-100 hover:bg-purple-200 text-purple-600 px-6 py-3 rounded-md font-medium transition">
              register
            </button>
          </Link>
        </div>
      </section>

      <PopularFilesSection files={files} categories={categories} />

      {/* Explore Button */}
      <div className="text-center">
        <Link href="/file">
          <button className="bg-purple-100 hover:bg-purple-200 text-purple-600 px-6 py-2 rounded-md font-medium transition">
            더 찾아보기
          </button>
        </Link>
      </div>
    </div>
  )
}

export default HomePage
