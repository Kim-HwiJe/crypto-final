'use client'

import { useState } from 'react'
import Image from 'next/image'

type Member = {
  name: string
  role: string
  imageUrl: string
  description: string
  github: string
  studentId: string
}

const members: Member[] = [
  {
    name: '강희수',
    role: '조장',
    imageUrl: '/1.png',
    description: '프로젝트 총괄 밑 전반 제작',
    github: 'https://github.com/persipica',
    studentId: '91913127',
  },
  {
    name: '김휘제',
    role: '암호화 페이지 제작',
    imageUrl: '/2.png',
    description: '암호화 설명 페이지 제작',
    github: '',
    studentId: '92313867',
  },
  {
    name: '김영욱',
    role: '메세지',
    imageUrl: '/3.png',
    description: '메세지 모듈을 담당하였습니다.',
    github: '',
    studentId: '',
  },
  {
    name: '오창민',
    role: '팀 소개',
    imageUrl: '/4.png',
    description: '팀 소개 페이지를 개발하였습니다.',
    github: 'https://github.com/ocm401',
    studentId: '92015257',
  },
  {
    name: '임건희',
    role: '사이드바 제작',
    imageUrl: '/5.png',
    description: '사이드바 제작',
    github: '',
    studentId: '',
  },
]

export default function TeamPage() {
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)

  return (
    <main className="p-10 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mt-8 mb-16 text-center text-purple-400">
        About Us
      </h1>
      <p className="text-center text-gray-600 mb-20"></p>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-8">
        {members.map((member) => (
          <div
            key={member.name}
            className="text-center cursor-pointer transition hover:scale-105"
            onClick={() => setSelectedMember(member)}
          >
            <Image
              src={member.imageUrl}
              alt={member.name}
              width={100}
              height={100}
              className="rounded-full mx-auto"
            />
            <p className="mt-2 text-sm text-gray-500">{member.role}</p>
            <p className="text-lg font-bold">{member.name}</p>
          </div>
        ))}
      </div>

      {/* 슬라이드 영역 */}
      <div
        className={`transition-all duration-500 overflow-hidden ${
          selectedMember
            ? 'max-h-[500px] opacity-100 mt-10'
            : 'max-h-0 opacity-0'
        }`}
      >
        {selectedMember && (
          <div className="p-6 border rounded-xl bg-gray-50 relative">
            {/* 닫기 버튼 */}
            <button
              onClick={() => setSelectedMember(null)}
              className="absolute top-2 right-2 text-gray-500 hover:text-red-500 text-xl font-bold"
              aria-label="닫기"
            >
              ×
            </button>

            <div className="flex items-center space-x-6">
              <Image
                src={selectedMember.imageUrl}
                alt={selectedMember.name}
                width={120}
                height={120}
                className="rounded-full"
              />
              <div>
                <h2 className="text-2xl font-bold">{selectedMember.name}</h2>
                <p className="text-gray-500 mb-2">{selectedMember.role}</p>
                <p>{selectedMember.description}</p>

                {selectedMember.studentId && (
                  <p className="mt-1 text-sm text-gray-600">
                    학번:{' '}
                    <span className="font-medium">
                      {selectedMember.studentId}
                    </span>
                  </p>
                )}

                {selectedMember.github && (
                  <p className="mt-2 text-sm text-gray-700">
                    GitHub 링크:{' '}
                    <a
                      href={selectedMember.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 underline break-all"
                    >
                      {selectedMember.github}
                    </a>
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
