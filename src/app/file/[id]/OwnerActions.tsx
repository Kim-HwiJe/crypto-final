// src/app/file/[id]/OwnerActions.tsx
'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Edit3, Trash2 } from 'lucide-react'

export default function OwnerActions({ fileId }: { fileId: string }) {
  const router = useRouter()

  const handleDelete = async () => {
    if (!confirm('정말 삭제하시겠습니까?')) return
    const res = await fetch(`/api/file/${fileId}`, { method: 'DELETE' })
    if (res.ok) {
      router.push('/file')
    } else {
      alert('삭제에 실패했습니다.')
    }
  }

  return (
    <div className="flex gap-4">
      <Link
        href={`/file/${fileId}/edit`}
        className="flex-1 flex items-center justify-center gap-1 px-6 py-3 border border-purple-600 text-purple-600 rounded-lg hover:bg-purple-50 transition"
      >
        <Edit3 size={18} /> 수정하기
      </Link>

      <button
        onClick={handleDelete}
        className="flex-1 flex items-center justify-center gap-1 px-6 py-3 border border-red-600 text-red-600 rounded-lg hover:bg-red-50 transition"
      >
        <Trash2 size={18} /> 삭제하기
      </button>
    </div>
  )
}
