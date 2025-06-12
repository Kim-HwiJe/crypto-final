'use client'
import React, { useState } from 'react'
import toast from 'react-hot-toast'

interface DownloadButtonProps {
  fileId: string
}

export default function DownloadButton({ fileId }: DownloadButtonProps) {
  const [progress, setProgress] = useState<number>(0)
  const [downloading, setDownloading] = useState(false)

  const handleDownload = () => {
    setDownloading(true)
    setProgress(0)

    const xhr = new XMLHttpRequest()
    xhr.open('GET', `/api/file/${fileId}/stream`, true)
    xhr.responseType = 'blob'

    xhr.onprogress = (e) => {
      if (e.lengthComputable) {
        setProgress(Math.round((e.loaded / e.total) * 100))
      }
    }

    xhr.onload = () => {
      setDownloading(false)

      if (xhr.status === 200) {
        const disposition = xhr.getResponseHeader('Content-Disposition') || ''
        let filename = 'download'
        const match = /filename\*=UTF-8''(.+)$/.exec(disposition)
        if (match && match[1]) {
          filename = decodeURIComponent(match[1])
        }

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
      } else {
        toast.error('다운로드에 실패했습니다.')
      }
    }

    xhr.onerror = () => {
      setDownloading(false)
      toast.error('네트워크 오류가 발생했습니다.')
    }

    xhr.send()
  }

  return (
    <div className="w-full space-y-2">
      {downloading && (
        <div className="w-full bg-gray-200 rounded-lg overflow-hidden h-3">
          <div
            className="h-full bg-purple-600 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      <button
        onClick={handleDownload}
        disabled={downloading}
        className={`w-full py-3 rounded-lg text-white font-medium transition ${
          downloading
            ? 'bg-purple-400 cursor-not-allowed'
            : 'bg-purple-600 hover:bg-purple-700'
        }`}
      >
        {downloading ? `${progress}%` : '다운로드'}
      </button>
    </div>
  )
}
