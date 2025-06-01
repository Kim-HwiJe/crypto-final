// src/app/messages/MessagesInner.tsx
'use client'

import React, {
  useEffect,
  useState,
  FormEvent,
  KeyboardEvent,
  MouseEvent,
} from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import toast from 'react-hot-toast'

type ChatMessage = {
  id: string
  author: 'me' | 'them'
  content: string
  timestamp: string
  edited?: boolean
}

type FileMeta = {
  title: string
  originalName: string
  ownerName: string
  ownerEmail: string
}

export default function MessagesInner() {
  const { data: session } = useSession()
  const me = session?.user?.email

  // URL 파라미터
  const searchParams = useSearchParams()
  const to = searchParams.get('to') || ''
  const fileId = searchParams.get('fileId') || ''

  // 파일 메타 / 아바타 / 메시지 상태
  const [fileMeta, setFileMeta] = useState<FileMeta | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string>('/default-avatar.png')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMsg, setNewMsg] = useState('')

  // “수정 모드” 관련 상태
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')

  // “수정/삭제 버튼”을 보여줄 메시지 ID
  const [selectedMsgId, setSelectedMsgId] = useState<string | null>(null)

  // 채팅방 고유 ID: "to-fileId"
  const chatId = `${to}-${fileId}`

  // ─────────────────────────────────────────────────────────────
  // 1) 파일 메타 로드
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!fileId) return
    fetch(`/api/file/${fileId}`)
      .then((res) => res.json())
      .then((data) => {
        setFileMeta({
          title: data.title,
          originalName: data.originalName,
          ownerName: data.ownerName,
          ownerEmail: data.ownerEmail,
        })
      })
      .catch(() => {
        toast.error('파일 정보를 불러오지 못했습니다.')
      })
  }, [fileId])

  // ─────────────────────────────────────────────────────────────
  // 2) 업로더 아바타 로드
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!fileMeta?.ownerEmail) return
    fetch(`/api/user/${encodeURIComponent(fileMeta.ownerEmail)}`)
      .then((res) => {
        if (!res.ok) throw new Error('유저 정보를 불러올 수 없습니다.')
        return res.json()
      })
      .then((user) => {
        setAvatarUrl(user.avatarUrl || '/default-avatar.png')
      })
      .catch(() => {
        // 실패해도 기본 아바타 유지
      })
  }, [fileMeta?.ownerEmail])

  // ─────────────────────────────────────────────────────────────
  // 3) 메시지 불러오기
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!me || !to || !fileId) return
    fetch(`/api/messages?chatId=${encodeURIComponent(chatId)}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.messages)) {
          setMessages(data.messages)
        } else {
          toast.error('메시지를 불러오지 못했습니다.')
        }
      })
      .catch(() => {
        toast.error('메시지 불러오기 중 오류가 발생했습니다.')
      })
  }, [me, to, fileId, chatId])

  // ─────────────────────────────────────────────────────────────
  // 4) 메시지 전송 로직
  // ─────────────────────────────────────────────────────────────
  const handleSend = async (e: FormEvent) => {
    e.preventDefault()
    if (!newMsg.trim() || !me || !to || !fileId) return

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId, to, fileId, content: newMsg.trim() }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.message || '전송에 실패했습니다.')
      }
      const sent: ChatMessage = await res.json()
      setMessages((prev) => [...prev, sent])
      setNewMsg('')
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 5) Enter 키로 전송하기
  // ─────────────────────────────────────────────────────────────
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend(e as unknown as FormEvent)
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 6) 메시지 삭제
  // ─────────────────────────────────────────────────────────────
  const deleteMessage = async (msgId: string) => {
    try {
      const res = await fetch(`/api/messages/${msgId}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('삭제 실패')
      setMessages((prev) => prev.filter((m) => m.id !== msgId))
      setSelectedMsgId(null)
    } catch {
      toast.error('메시지 삭제에 실패했습니다.')
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 7) 메시지 수정 저장
  // ─────────────────────────────────────────────────────────────
  const saveEdit = async (msgId: string) => {
    if (!editContent.trim()) return
    try {
      const res = await fetch(`/api/messages/${msgId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editContent.trim() }),
      })
      if (!res.ok) throw new Error('수정 실패')
      setMessages((prev) =>
        prev.map((m) =>
          m.id === msgId
            ? { ...m, content: editContent.trim(), edited: true }
            : m
        )
      )
      setEditingId(null)
      setEditContent('')
      setSelectedMsgId(null)
    } catch {
      toast.error('메시지 수정에 실패했습니다.')
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 8) 날짜별로 메시지 그룹핑
  // ─────────────────────────────────────────────────────────────
  const grouped = messages.reduce<Record<string, ChatMessage[]>>((acc, msg) => {
    const date = new Date(msg.timestamp).toLocaleDateString('ko-KR')
    if (!acc[date]) acc[date] = []
    acc[date].push(msg)
    return acc
  }, {})

  // ─────────────────────────────────────────────────────────────
  // 9) 메시지 버블 클릭 시 “수정/삭제 버튼” 토글
  //     → 편집 중인 메시지일 때는 무시
  // ─────────────────────────────────────────────────────────────
  const handleBubbleClick = (msgId: string, e: MouseEvent) => {
    e.stopPropagation()
    // 편집 모드가 active 상태라면, 토글 동작을 건너뛴다
    if (editingId === msgId) return
    setSelectedMsgId((prev) => (prev === msgId ? null : msgId))
  }

  // ─────────────────────────────────────────────────────────────
  // 10) 화면을 클릭하면 선택 해제 (버튼 숨기기)
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const handleClickOutside = () => {
      setSelectedMsgId(null)
      setEditingId(null)
    }
    window.addEventListener('click', handleClickOutside)
    return () => {
      window.removeEventListener('click', handleClickOutside)
    }
  }, [])

  return (
    <div className="h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 flex h-full pt-4">
        {/* 왼쪽: 단일 채팅 상대 */}
        <aside className="w-80 bg-white border border-gray-200 rounded-lg overflow-y-auto">
          <h2 className="p-4 font-semibold border-b text-gray-600">메시지</h2>
          {fileMeta && (
            <div className="flex items-center p-4 cursor-pointer bg-gray-100 text-purple-600">
              <Image
                src={avatarUrl}
                alt={fileMeta.ownerName}
                width={40}
                height={40}
                className="rounded-full"
              />
              <div className="ml-3">
                <p className="font-medium">{fileMeta.ownerName}</p>
                <p className="text-sm text-gray-500">{fileMeta.ownerEmail}</p>
                <p className="text-xs text-gray-400 mt-1">
                  파일: {fileMeta.originalName}
                </p>
              </div>
            </div>
          )}
        </aside>

        {/* 오른쪽: 대화창 */}
        <section className="flex-1 flex flex-col ml-6 bg-white border border-gray-200 rounded-lg overflow-hidden">
          {/* 상단 헤더 */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center space-x-3">
              <Image
                src={avatarUrl}
                alt={fileMeta?.ownerName ?? ''}
                width={40}
                height={40}
                className="rounded-full"
              />
              <div>
                <p className="font-semibold text-purple-600">
                  {fileMeta?.ownerName}
                </p>
                <p className="text-sm text-gray-500">{fileMeta?.ownerEmail}</p>
              </div>
            </div>

            {fileMeta && (
              // 파일명 클릭 시 상세페이지로 이동
              <Link
                href={`/file/${fileId}`}
                className="text-right hover:underline"
              >
                <p className="font-medium text-gray-800">{fileMeta.title}</p>
                <p className="text-sm text-gray-500">{fileMeta.originalName}</p>
              </Link>
            )}
          </div>

          {/* 메시지 리스트 */}
          <div className="flex-1 p-4 overflow-y-auto space-y-6">
            {Object.entries(grouped).map(([date, msgs]) => (
              <div key={date}>
                <div className="text-center text-gray-500 text-sm mb-4">
                  {date}
                </div>
                {msgs.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex items-start space-x-2 ${
                      msg.author === 'me' ? 'justify-end' : ''
                    }`}
                    onClick={(e) => {
                      // 자신의 메시지이고, 편집 모드가 아니면
                      if (msg.author === 'me' && editingId !== msg.id) {
                        handleBubbleClick(msg.id, e)
                      }
                    }}
                  >
                    {/* 상대의 메시지인 경우: 아바타 */}
                    {msg.author === 'them' && (
                      <Image
                        src={avatarUrl}
                        alt={fileMeta?.ownerName ?? ''}
                        width={32}
                        height={32}
                        className="rounded-full"
                      />
                    )}

                    {/* 메시지 버블 + (수정/삭제 or 편집) */}
                    <div className="max-w-[70%] relative">
                      {editingId === msg.id ? (
                        // 편집 모드 (textarea + 저장/취소 버튼)
                        <div className="space-y-2">
                          <textarea
                            rows={2}
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full border border-gray-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-800"
                          />
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setEditingId(null)
                                setEditContent('')
                              }}
                              className="px-3 py-1 text-sm text-gray-600 hover:underline"
                            >
                              취소
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                saveEdit(msg.id)
                              }}
                              className="px-3 py-1 bg-purple-600 text-white text-sm rounded hover:bg-purple-700"
                            >
                              저장
                            </button>
                          </div>
                        </div>
                      ) : (
                        // 일반 표시 모드 (버블 + “수정/삭제 버튼” 영역)
                        <div className="space-y-1">
                          <div
                            className={`prose max-w-prose p-4 mt-2 rounded-lg whitespace-pre-wrap ${
                              msg.author === 'me'
                                ? 'ml-auto bg-purple-100 text-purple-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            <span>{msg.content}</span>
                            {msg.edited && (
                              <span className="ml-2 text-xs text-gray-500">
                                (수정됨)
                              </span>
                            )}
                            <div className="text-right text-xs text-gray-400 mt-1">
                              {new Date(msg.timestamp).toLocaleTimeString(
                                'ko-KR',
                                {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                }
                              )}
                            </div>
                          </div>

                          {/* “수정/삭제” 버튼: 자신의 메시지가 선택된 경우 */}
                          {selectedMsgId === msg.id && (
                            <div className="flex space-x-3 ml-4 mt-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setEditingId(msg.id)
                                  setEditContent(msg.content)
                                  setSelectedMsgId(null)
                                }}
                                className="text-xs text-gray-500 hover:text-purple-600"
                              >
                                수정
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  deleteMessage(msg.id)
                                }}
                                className="text-xs text-gray-500 hover:text-red-600"
                              >
                                삭제
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* 자신의 메시지인 경우: 내 아바타 (편집 모드 제외) */}
                    {msg.author === 'me' && editingId !== msg.id && (
                      <Image
                        src={session?.user?.image || '/default-avatar.png'}
                        alt="나"
                        width={32}
                        height={32}
                        className="rounded-full"
                      />
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* 답장 입력 폼 */}
          <form
            onSubmit={handleSend}
            className="p-4 border-t flex items-center space-x-3"
          >
            <textarea
              rows={1}
              value={newMsg}
              onChange={(e) => setNewMsg(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="메시지 입력... (엔터키로 전송, Shift+Enter 줄바꿈)"
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-600"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
            >
              보내기
            </button>
          </form>
        </section>
      </div>
    </div>
  )
}
