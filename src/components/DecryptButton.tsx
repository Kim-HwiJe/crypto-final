'use client'
import React, { useState, useRef, useEffect } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'

interface DecryptButtonProps {
  fileId: string
}

export default function DecryptButton({ fileId }: DecryptButtonProps) {
  const [showInput, setShowInput] = useState(false)
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [progress, setProgress] = useState(0)
  const [decrypting, setDecrypting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (
        showInput &&
        containerRef.current &&
        !containerRef.current.contains(e.target as Node) &&
        !decrypting
      ) {
        setShowInput(false)
        setErrorMessage(null)
        setPassword('')
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => {
      document.removeEventListener('mousedown', onClickOutside)
    }
  }, [showInput, decrypting])

  const handleDecryptClick = () => setShowInput(true)

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password) {
      setErrorMessage('비밀번호를 입력해주세요')
      setTimeout(() => setErrorMessage(null), 2000)
      return
    }

    setDecrypting(true)
    setProgress(0)

    const xhr = new XMLHttpRequest()
    xhr.open(
      'GET',
      `/api/file/${fileId}/stream?password=${encodeURIComponent(password)}`,
      true
    )
    xhr.responseType = 'blob'

    xhr.onprogress = (ev) => {
      if (ev.lengthComputable) {
        setProgress(Math.round((ev.loaded / ev.total) * 100))
      }
    }

    xhr.onload = () => {
      setDecrypting(false)
      if (xhr.status === 401) {
        setErrorMessage('비밀번호가 틀렸습니다!')
        setTimeout(() => setErrorMessage(null), 2000)
        return
      }
      if (xhr.status !== 200) {
        toast.error('복호화에 실패했습니다.')
        return
      }

      const disp = xhr.getResponseHeader('Content-Disposition') || ''
      let filename = 'download'
      const m = /filename\*=UTF-8''(.+)$/.exec(disp)
      if (m && m[1]) filename = decodeURIComponent(m[1])

      const blob = xhr.response
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)

      toast.success('다운로드 완료!')
      setShowInput(false)
      setPassword('')
      setProgress(0)
    }

    xhr.onerror = () => {
      setDecrypting(false)
      toast.error('네트워크 오류 발생')
    }

    xhr.send()
  }

  return (
    <div ref={containerRef} className="space-y-2 w-full max-w-md">
      {/* 진행률 바 */}
      {decrypting && (
        <div className="w-full bg-gray-200 rounded-lg overflow-hidden h-3">
          <div
            className="h-full bg-yellow-500 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* 복호화 버튼 */}
      {!showInput && !decrypting && (
        <button
          onClick={handleDecryptClick}
          className="w-full py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-medium transition"
        >
          복호화
        </button>
      )}

      {/* 비밀번호 입력 & 확인 */}
      {showInput && (
        <form onSubmit={handleConfirm} className="space-y-2">
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 pr-10 text-gray-600"
              disabled={decrypting}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute inset-y-0 right-3 flex items-center"
            >
              {showPassword ? (
                <EyeOff size={20} className="text-gray-500" />
              ) : (
                <Eye size={20} className="text-gray-500" />
              )}
            </button>
          </div>
          <button
            type="submit"
            disabled={decrypting}
            className="w-full py-2 bg-yellow-600 hover:bg-yellow-700 text-white font-medium rounded-lg transition disabled:opacity-50"
          >
            {decrypting ? `${progress}%` : errorMessage ?? '확인'}
          </button>
        </form>
      )}
    </div>
  )
}
