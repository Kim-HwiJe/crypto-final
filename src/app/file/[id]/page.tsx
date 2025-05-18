import { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { MessageSquare, Share2 } from 'lucide-react'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import clientPromise from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import OwnerActions from './OwnerActions'
import DownloadButton from '@/components/DownloadButton'
import DecryptButton from '@/components/DecryptButton'
import Tooltip from '@/components/Tooltip'

type FileInfo = {
  id: string
  filename: string
  originalName: string
  title: string
  description?: string
  ownerName: string
  ownerAvatar: string
  ownerEmail: string
  createdAt: string
  isEncrypted: boolean
  algorithm?: string
  isLocked: boolean
  isPublic: boolean
  views: number
}

// 1) 메타데이터는 files 콜렉션에서만!
async function getFileInfo(id: string): Promise<FileInfo> {
  if (!ObjectId.isValid(id)) throw new Error('잘못된 파일 ID입니다.')

  const client = await clientPromise
  const db = client.db()
  const doc = await db.collection('files').findOne<{
    filename: string
    originalName: string
    title: string
    description?: string
    ownerName: string
    ownerAvatar: string
    ownerEmail: string
    createdAt: Date
    isEncrypted: boolean
    encryptionMeta?: { algorithm: string }
    isLocked: boolean
    isPublic: boolean
    algorithm?: string
    views?: number
  }>({ _id: new ObjectId(id) })

  if (!doc) throw new Error('파일을 찾을 수 없습니다.')

  return {
    id,
    filename: doc.filename,
    originalName: doc.originalName,
    title: doc.title || doc.originalName,
    description: doc.description,
    ownerName: doc.ownerName,
    ownerAvatar: doc.ownerAvatar,
    ownerEmail: doc.ownerEmail,
    createdAt: doc.createdAt.toISOString(),
    isEncrypted: doc.isEncrypted,
    algorithm: doc.algorithm ?? doc.encryptionMeta?.algorithm, // ← 이렇게!
    isLocked: doc.isLocked,
    isPublic: doc.isPublic,
    views: doc.views ?? 0,
  }
}

// 2) 타이틀 메타
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  try {
    const info = await getFileInfo(id)
    return { title: info.title }
  } catch {
    return { title: '파일 상세' }
  }
}

export default async function FileDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const file = await getFileInfo(id)
  const session = await getServerSession(authOptions)
  const me = session?.user?.email

  // 확장자로 타입 판별
  const ext = file.filename.split('.').pop()?.toLowerCase() || ''
  const isImage = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'avif'].includes(ext)
  const isAudio = ['mp3', 'wav', 'ogg'].includes(ext)
  const isVideo = ['mp4', 'webm', 'ogg'].includes(ext)

  // 기본 아이콘 매핑
  const ICON_MAP: Record<'image' | 'audio' | 'video' | 'file', string> = {
    image: '/icons/image.png',
    audio: '/icons/audio.png',
    video: '/icons/video.png',
    file: '/icons/file.png',
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* Preview 영역 */}
      <div className="relative w-full h-80 bg-gray-100 rounded-lg overflow-hidden">
        {file.isPublic && !file.isEncrypted && isImage && (
          <Image
            src={`/api/file/${file.id}/stream`}
            alt={file.originalName}
            fill
            className="object-cover"
          />
        )}
        {file.isPublic && !file.isEncrypted && isAudio && (
          <audio
            src={`/api/file/${file.id}/stream`}
            controls
            className="w-full h-full"
          />
        )}
        {file.isPublic && !file.isEncrypted && isVideo && (
          <video
            src={`/api/file/${file.id}/stream`}
            controls
            className="w-full h-full object-cover"
          />
        )}
        {!(
          file.isPublic &&
          !file.isEncrypted &&
          (isImage || isAudio || isVideo)
        ) && (
          <div className="flex items-center justify-center h-full">
            <Image
              src={
                isImage
                  ? ICON_MAP.image
                  : isAudio
                  ? ICON_MAP.audio
                  : isVideo
                  ? ICON_MAP.video
                  : ICON_MAP.file
              }
              alt="파일 아이콘"
              width={64}
              height={64}
            />
          </div>
        )}
      </div>

      {/* 상세 정보 영역 */}
      <div className="space-y-6">
        {/* 업로더 */}
        <div className="flex items-center gap-3">
          <Image
            src={file.ownerAvatar}
            alt={`${file.ownerName} 아바타`}
            width={40}
            height={40}
            className="rounded-full"
          />
          <div>
            <p className="text-sm text-gray-500">업로더</p>
            <p className="font-medium text-purple-500">{file.ownerName}</p>
          </div>
        </div>

        {/* 메타 */}
        <div className="flex items-center justify-between text-xs text-gray-400 space-x-2">
          <span>
            {new Date(file.createdAt).toLocaleString('ko-KR', {
              dateStyle: 'short',
              timeStyle: 'short',
            })}
          </span>
          <div className="flex items-center space-x-2">
            {file.isEncrypted && (
              <Tooltip
                message={
                  file.algorithm
                    ? `${file.algorithm} 방식으로 암호화됨`
                    : '암호화 방식 알 수 없음'
                }
              >
                <span className="px-2 py-1 bg-yellow-200 text-yellow-800 rounded text-xs cursor-help">
                  암호화됨
                </span>
              </Tooltip>
            )}
            {file.isLocked && (
              <Tooltip message="다운로드에 비밀번호가 필요함">
                <span className="px-2 py-1 bg-green-200 text-green-800 rounded text-xs cursor-help">
                  잠긴 파일
                </span>
              </Tooltip>
            )}
            <span>👁 {file.views}</span>
          </div>
        </div>

        {/* 제목 & 원본명 */}
        <h1 className="text-2xl font-bold text-gray-600">{file.title}</h1>
        <h2 className="text-2xl font-bold text-gray-400">
          {file.originalName}
        </h2>

        {/* 설명 */}
        {file.description && (
          <p className="text-gray-700 whitespace-pre-wrap">
            {file.description}
          </p>
        )}

        {/* 액션 버튼 */}
        {me === file.ownerEmail ? (
          <OwnerActions fileId={file.id} />
        ) : (
          <div className="flex flex-col md:flex-row gap-4">
            {/* 다운로드 버튼 */}
            <DownloadButton fileId={file.id} />

            {/* 암호화된 파일일 때만 복호화 버튼 */}
            {file.isEncrypted && <DecryptButton fileId={file.id} />}

            {/* 메시지/공유 */}
            <div className="flex-1 flex items-center space-x-4 text-gray-600">
              <Link
                href={`/messages?to=${encodeURIComponent(file.ownerName)}`}
                className="flex items-center gap-1 hover:text-purple-600 transition"
              >
                <MessageSquare size={18} /> 메시지
              </Link>
              <button className="flex items-center gap-1 hover:text-purple-600 transition">
                <Share2 size={18} /> 공유하기
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
