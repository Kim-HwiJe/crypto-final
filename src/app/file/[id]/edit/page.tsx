'use client'

import React, { useState, useEffect, FormEvent } from 'react'
import { useRouter, useParams } from 'next/navigation'
import toast from 'react-hot-toast'

const categories = [
  '음악',
  '이미지',
  '영상',
  '텍스트',
  '게임',
  '소프트웨어',
  '기타',
] as const

export default function EditFilePage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  // 로딩 상태
  const [loading, setLoading] = useState(false)

  // 폼 필드
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<(typeof categories)[number]>(
    categories[0]
  )
  const [expiresAt, setExpiresAt] = useState('')

  // 1) 초기 데이터 로드
  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/file/${id}`)
      if (!res.ok) {
        toast.error('파일 정보를 불러오지 못했습니다.')
        return
      }
      const data = await res.json()
      setTitle(data.title)
      setDescription(data.description || '')
      setCategory(data.category)
      setExpiresAt(data.expiresAt?.slice(0, 10) || '')
    }
    load()
  }, [id])

  // 2) 폼 제출 핸들러
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // 만료일 유효성 검사
    if (expiresAt) {
      const expireDate = new Date(expiresAt)
      if (expireDate <= new Date()) {
        toast.error('만료일은 오늘 이후여야 합니다.')
        setLoading(false)
        return
      }
    }

    // PATCH 바디 구성
    const body: any = {
      title,
      description,
      category,
      expiresAt: expiresAt || null,
    }

    const res = await fetch(`/api/file/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const result = await res.json()

    if (res.ok) {
      toast.success('파일 정보가 업데이트되었습니다.')
      router.push(`/file/${id}`)
    } else {
      toast.error(result.message || '수정에 실패했습니다.')
    }
    setLoading(false)
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4 text-gray-700">파일 수정</h1>
      <form
        onSubmit={handleSubmit}
        className="space-y-6 bg-white p-6 shadow rounded"
      >
        {/* 제목 */}
        <div>
          <label className="block mb-1 font-medium text-gray-700">제목</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border px-3 py-2 rounded text-gray-700"
            placeholder="제목을 입력하세요"
            required
          />
        </div>

        {/* 설명 */}
        <div>
          <label className="block mb-1 font-medium text-gray-700">
            설명 (선택)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full border px-3 py-2 rounded text-gray-700 resize-none"
            rows={4}
            placeholder="파일에 대한 설명을 입력하세요"
          />
        </div>

        {/* 카테고리 */}
        <div>
          <label className="block mb-1 font-medium text-gray-700">
            카테고리
          </label>
          <select
            value={category}
            onChange={(e) =>
              setCategory(e.target.value as (typeof categories)[number])
            }
            className="w-full border px-3 py-2 rounded text-gray-700"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* 만료일 */}
        <div>
          <label className="block mb-1 font-medium text-gray-700">
            게시 만료일 (선택)
          </label>
          <input
            type="date"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
            className="w-full border px-3 py-2 rounded text-gray-700"
          />
        </div>

        {/* 수정 버튼 */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded disabled:opacity-50"
        >
          {loading ? '수정 중…' : '수정 완료'}
        </button>
      </form>
    </div>
  )
}
