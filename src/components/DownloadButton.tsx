// src/components/DownloadButton.tsx
'use client'

import React from 'react'

interface DownloadButtonProps {
  fileId: string
}

export default function DownloadButton({ fileId }: DownloadButtonProps) {
  const handleDownload = () => {
    window.open(`/api/file/${fileId}/stream`, '_blank')
  }

  return (
    <button
      onClick={handleDownload}
      className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition"
    >
      다운로드
    </button>
  )
}
