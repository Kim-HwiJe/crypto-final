// src/components/DecryptButton.tsx
'use client'

import React, { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'

interface DecryptButtonProps {
  fileId: string
}

export default function DecryptButton({ fileId }: DecryptButtonProps) {
  const [showInput, setShowInput] = useState(false)
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [buttonLabel, setButtonLabel] = useState('복호화')

  const streamUrl = (pwd?: string) =>
    pwd
      ? `/api/file/${fileId}/stream?password=${encodeURIComponent(pwd)}`
      : `/api/file/${fileId}/stream`

  const handleClick = () => {
    if (!showInput) {
      setShowInput(true)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password) {
      toast.error('비밀번호를 입력해주세요.')
      return
    }
    setLoading(true)
    try {
      const url = streamUrl(password)
      const res = await fetch(url, { method: 'GET' })
      if (res.status === 401) {
        setButtonLabel('비밀번호가 틀렸습니다!')
        setTimeout(() => setButtonLabel('복호화'), 2000)
      } else if (!res.ok) {
        const err = await res.json()
        toast.error(err.message || '복호화에 실패했습니다.')
      } else {
        window.open(url, '_blank')
        setShowInput(false)
        setPassword('')
      }
    } catch (err) {
      console.error(err)
      toast.error('복호화 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-2">
      <button
        onClick={handleClick}
        disabled={loading}
        className="w-full px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition disabled:opacity-50"
      >
        {loading ? '…' : buttonLabel}
      </button>

      {showInput && (
        <form onSubmit={handleSubmit} className="flex items-center space-x-2">
          <div className="relative flex-1">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호"
              className="w-full border border-gray-300 rounded px-3 py-2 pr-10 text-gray-700"
              required
            />
            <button
              type="button"
              className="absolute inset-y-0 right-2 flex items-center"
              onClick={() => setShowPassword((v) => !v)}
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
            disabled={loading}
            className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded disabled:opacity-50"
          >
            확인
          </button>
        </form>
      )}
    </div>
  )
}
