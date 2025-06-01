// src/app/file/[id]/page.tsx

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
import ShareLink from '@/components/ShareLink'

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
  category: string
}

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
    category: string
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
    algorithm: doc.algorithm ?? doc.encryptionMeta?.algorithm,
    isLocked: doc.isLocked,
    isPublic: doc.isPublic,
    views: doc.views ?? 0,
    category: doc.category,
  }
}

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

  const ICON_MAP: Record<string, string> = {
    음악: '/icons/audio.png',
    이미지: '/icons/image.png',
    영상: '/icons/video.png',
    텍스트: '/icons/file.png',
    게임: '/icons/game.png',
    소프트웨어: '/icons/software.png',
    기타: '/icons/etc.png',
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* Preview */}
      <div className="relative w-full h-80 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
        {file.isPublic && !file.isEncrypted ? (
          <Image
            src={`/api/file/${file.id}/stream`}
            alt={file.originalName}
            fill
            className="object-cover"
          />
        ) : (
          <Image
            src={ICON_MAP[file.category] || ICON_MAP['기타']}
            alt={`${file.category} 아이콘`}
            width={64}
            height={64}
            className="object-contain"
          />
        )}
      </div>

      {/* Details */}
      <div className="space-y-6">
        <Link
          href={`/user/${encodeURIComponent(file.ownerEmail)}`}
          className="flex items-center gap-3 hover:underline"
        >
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
        </Link>

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

        <h1 className="text-2xl font-bold text-gray-600">{file.title}</h1>
        <h2 className="text-2xl font-bold text-gray-400">
          {file.originalName}
        </h2>

        {file.description && (
          <p className="text-gray-700 whitespace-pre-wrap">
            {file.description}
          </p>
        )}

        {me === file.ownerEmail ? (
          <OwnerActions fileId={file.id} />
        ) : (
          <div className="flex flex-col md:flex-row gap-4">
            <DownloadButton fileId={file.id} />
            {file.isEncrypted && <DecryptButton fileId={file.id} />}

            <div className="flex items-center space-x-4 text-gray-600">
              <Tooltip message="해당 업로더와 메시지하기">
                <Link
                  href={`/messages?to=${encodeURIComponent(
                    file.ownerEmail
                  )}&fileId=${encodeURIComponent(file.id)}`}
                  className="p-2 hover:text-purple-600 transition"
                >
                  <MessageSquare size={18} />
                </Link>
              </Tooltip>

              <Tooltip message="해당 게시글 공유하기">
                <ShareLink />
              </Tooltip>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
