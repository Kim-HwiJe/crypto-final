'use client'
import React from 'react'
import toast from 'react-hot-toast'
import { Share2 } from 'lucide-react'

export default function ShareLink() {
  const handleCopy = async () => {
    try {
      const fullUrl = window.location.href
      await navigator.clipboard.writeText(fullUrl)
      toast.success('게시글 복사 완료!')
    } catch (err) {
      console.error('클립보드 복사 실패:', err)
      toast.error('복사에 실패했습니다.')
    }
  }

  return (
    <button
      onClick={handleCopy}
      className="p-2 hover:text-purple-600 transition"
      title="해당 게시글 공유하기"
    >
      <Share2 size={18} />
    </button>
  )
}
