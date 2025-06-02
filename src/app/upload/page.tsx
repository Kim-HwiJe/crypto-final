// src/app/upload/page.tsx
'use client'

import React, { useState, ChangeEvent, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { Eye, EyeOff } from 'lucide-react'

const categories = [
  '음악',
  '이미지',
  '영상',
  '텍스트',
  '게임',
  '소프트웨어',
  '기타',
] as const

const algorithms = ['AES-256-CBC', 'AES-256-GCM', 'ChaCha20-Poly1305'] as const

export default function UploadPage() {
  const router = useRouter()

  // --- 상태 관리 ---
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [category, setCategory] = useState<(typeof categories)[number]>(
    categories[0]
  )

  const [mode, setMode] = useState<'public' | 'encrypted'>('public')
  const [decryptPassword, setDecryptPassword] = useState('')
  const [showDecryptPassword, setShowDecryptPassword] = useState(false)
  const [algorithm, setAlgorithm] = useState<(typeof algorithms)[number]>(
    algorithms[0]
  )

  const [expiresAt, setExpiresAt] = useState('')

  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)

  const CHUNK_SIZE = 4 * 1024 * 1024 // 4MB

  // 파일 선택 핸들러
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files?.[0] ?? null)
  }

  // 제출 핸들러
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    if (!file) {
      toast.error('파일을 선택해주세요.')
      return
    }
    if (mode === 'encrypted' && !decryptPassword) {
      toast.error('복호화 비밀번호를 입력해주세요.')
      return
    }
    if (expiresAt) {
      const expireDate = new Date(expiresAt)
      if (expireDate <= new Date()) {
        toast.error('만료일은 오늘 이후여야 합니다.')
        return
      }
    }

    setLoading(true)
    setProgress(0)

    // 1) 파일 크기가 4MB 이하 → 기존 단일 업로드 로직 (XHR)
    if (file.size <= CHUNK_SIZE) {
      const formData = new FormData()
      formData.append('title', title)
      formData.append('description', description)
      formData.append('file', file)
      formData.append('category', category)
      const isEncrypted = mode === 'encrypted'
      formData.append('isEncrypted', String(isEncrypted))
      formData.append('lockPassword', decryptPassword)
      formData.append('algorithm', algorithm)
      if (expiresAt) formData.append('expiresAt', expiresAt)

      // XHR 객체 생성
      const xhr = new XMLHttpRequest()
      xhr.open('POST', '/api/file/upload', true)

      // 진행률 추적
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100)
          setProgress(percent)
        }
      }

      // 완료 처리
      xhr.onload = () => {
        setLoading(false)
        if (xhr.status === 200) {
          const data = JSON.parse(xhr.responseText)
          toast.success('업로드 완료!')
          router.push(`/file/${data.id}`)
        } else {
          let msg = '업로드에 실패했습니다.'
          try {
            const err = JSON.parse(xhr.responseText)
            if (err.message) msg = err.message
          } catch {}
          toast.error(msg)
        }
      }

      xhr.onerror = () => {
        setLoading(false)
        toast.error('네트워크 오류로 업로드에 실패했습니다.')
      }

      // 전송
      xhr.send(formData)
      return
    }

    // 2) 파일 크기 > 4MB → 청크 업로드 모드
    try {
      const totalChunks = Math.ceil(file.size / CHUNK_SIZE)
      let uploadedFileId: string | null = null

      for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
        const start = chunkIndex * CHUNK_SIZE
        const end = Math.min(start + CHUNK_SIZE, file.size)
        const chunkBlob = file.slice(start, end)

        const chunkFormData = new FormData()
        // 청크 전송용 필드
        chunkFormData.append('chunk', chunkBlob)
        chunkFormData.append('filename', file.name)
        chunkFormData.append('chunkIndex', String(chunkIndex))
        chunkFormData.append('totalChunks', String(totalChunks))

        // 기존 메타데이터도 함께 전송 (매번 보내도 무방)
        chunkFormData.append('title', title)
        chunkFormData.append('description', description)
        chunkFormData.append('category', category)
        const isEncrypted = mode === 'encrypted'
        chunkFormData.append('isEncrypted', String(isEncrypted))
        chunkFormData.append('lockPassword', decryptPassword)
        chunkFormData.append('algorithm', algorithm)
        if (expiresAt) chunkFormData.append('expiresAt', expiresAt)

        // fetch로 청크 업로드
        const response = await fetch('/api/file/upload', {
          method: 'POST',
          body: chunkFormData,
        })

        if (!response.ok) {
          const errorBody = await response.json().catch(() => ({}))
          const message =
            errorBody.message || '청크 업로드 도중 오류가 발생했습니다.'
          throw new Error(message)
        }

        const json = await response.json()
        // 마지막 청크에서만 id가 리턴된다
        if (json.id) {
          uploadedFileId = json.id
        }

        // 전송 진행률 업데이트 (0~100)
        const percent = Math.round(((chunkIndex + 1) / totalChunks) * 100)
        setProgress(percent)
      }

      setLoading(false)
      if (uploadedFileId) {
        toast.success('업로드 완료!')
        router.push(`/file/${uploadedFileId}`)
      } else {
        // 예외적으로 id가 안 넘어온 경우
        toast.error('업로드는 완료되었으나, 파일 ID를 받을 수 없었습니다.')
      }
    } catch (err: any) {
      setLoading(false)
      toast.error(err.message || '청크 업로드에 실패했습니다.')
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4 text-gray-700">파일 업로드</h1>
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
            placeholder="제목을 입력하세요"
            className="w-full border px-3 py-2 rounded text-gray-700"
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
            placeholder="파일에 대한 설명을 입력하세요"
            className="w-full border px-3 py-2 rounded text-gray-700 resize-none"
            rows={4}
          />
        </div>

        {/* 파일 선택 */}
        <div>
          <label className="block mb-1 font-medium text-gray-700">
            파일 선택
          </label>
          <input
            type="file"
            onChange={handleFileChange}
            className="block text-gray-700"
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

        {/* 공개 vs 암호화 모드 */}
        <div className="space-y-1">
          <p className="font-medium text-gray-700">공개 설정</p>
          <div className="flex items-center space-x-6 text-gray-700">
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                name="mode"
                value="public"
                checked={mode === 'public'}
                onChange={() => setMode('public')}
              />
              <span>공개</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                name="mode"
                value="encrypted"
                checked={mode === 'encrypted'}
                onChange={() => setMode('encrypted')}
              />
              <span>암호화</span>
            </label>
          </div>
        </div>

        {/* 암호화 옵션 */}
        {mode === 'encrypted' && (
          <>
            <div>
              <label className="block mb-1 font-medium text-gray-700">
                암호화 방식
              </label>
              <select
                value={algorithm}
                onChange={(e) =>
                  setAlgorithm(e.target.value as (typeof algorithms)[number])
                }
                className="w-full border px-3 py-2 rounded text-gray-700"
              >
                {algorithms.map((alg) => (
                  <option key={alg} value={alg}>
                    {alg}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block mb-1 font-medium text-gray-700">
                복호화 비밀번호
              </label>
              <div className="relative">
                <input
                  type={showDecryptPassword ? 'text' : 'password'}
                  value={decryptPassword}
                  onChange={(e) => setDecryptPassword(e.target.value)}
                  placeholder="비밀번호를 입력하세요"
                  className="w-full border px-3 py-2 rounded text-gray-700 pr-10"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-3 flex items-center"
                  onClick={() => setShowDecryptPassword((v) => !v)}
                >
                  {showDecryptPassword ? (
                    <EyeOff size={20} className="text-gray-600" />
                  ) : (
                    <Eye size={20} className="text-gray-600" />
                  )}
                </button>
              </div>
            </div>
          </>
        )}

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

        {/* 진행 바 */}
        {loading && (
          <div className="w-full bg-gray-200 rounded h-2 overflow-hidden">
            <div
              className="h-full bg-purple-600 transition-width duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        {/* 제출 버튼 */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded disabled:opacity-50"
        >
          {loading ? '업로드 중…' : '게시하기'}
        </button>
      </form>
    </div>
  )
}
