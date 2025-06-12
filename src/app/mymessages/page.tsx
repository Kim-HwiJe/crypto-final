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
import toast from 'react-hot-toast'
import { mutate } from 'swr'

type ChatMessage = {
  id: string
  author: 'me' | 'them'
  content: string
  timestamp: string
  edited?: boolean
}

type ChatRoom = {
  fileId: string
  title: string
  originalName: string
  unreadCount: number
}

type ChatWithUser = {
  userEmail: string
  userName: string
  avatarUrl: string
  rooms: ChatRoom[]
}

export default function MyMessage() {
  const { data: session } = useSession()
  const me = session?.user?.email!

  const [chatList, setChatList] = useState<ChatWithUser[]>([])
  const [activeUser, setActiveUser] = useState<ChatWithUser | null>(null)
  const [activeRoom, setActiveRoom] = useState<ChatRoom | null>(null)

  const [userProfiles, setUserProfiles] = useState<
    Record<string, { name: string; avatarUrl: string }>
  >({})

  const [profile, setProfile] = useState<{
    name: string
    avatarUrl: string
    email: string
  } | null>(null)

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMsg, setNewMsg] = useState('')

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')

  const [selectedMsgId, setSelectedMsgId] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/messages/chats')
      .then((res) => res.json())
      .then((data: ChatWithUser[]) => setChatList(data))
      .catch(() => toast.error('채팅 목록을 불러오지 못했습니다.'))
  }, [])

  useEffect(() => {
    chatList.forEach((user) => {
      if (!userProfiles[user.userEmail]) {
        fetch(`/api/user/${encodeURIComponent(user.userEmail)}`)
          .then((res) => (res.ok ? res.json() : Promise.reject()))
          .then((u: { name: string; avatarUrl: string }) => {
            setUserProfiles((prev) => ({
              ...prev,
              [user.userEmail]: {
                name: u.name,
                avatarUrl: u.avatarUrl || '/default-avatar.png',
              },
            }))
          })
          .catch(() => {
            setUserProfiles((prev) => ({
              ...prev,
              [user.userEmail]: {
                name: user.userName,
                avatarUrl: user.avatarUrl || '/default-avatar.png',
              },
            }))
          })
      }
    })
  }, [chatList, userProfiles])

  useEffect(() => {
    if (!activeUser) {
      setActiveRoom(null)
      setMessages([])
      setProfile(null)
      return
    }
    if (activeUser.rooms.length > 0) {
      setActiveRoom(activeUser.rooms[0])
    }
    const p = userProfiles[activeUser.userEmail]
    if (p) {
      setProfile({
        name: p.name,
        avatarUrl: p.avatarUrl,
        email: activeUser.userEmail,
      })
    }
  }, [activeUser, userProfiles])

  useEffect(() => {
    if (!activeRoom || !activeUser) return
    const chatId = `${activeUser.userEmail}-${activeRoom.fileId}`

    fetch(`/api/messages?chatId=${encodeURIComponent(chatId)}`)
      .then((res) => res.json())
      .then((data) => {
        setMessages(data.messages)
        mutate('/api/messages/unreadCount')
        return fetch('/api/messages/chats')
      })
      .then((res) => res.json())
      .then((updated: ChatWithUser[]) => setChatList(updated))
      .catch(() => toast.error('메시지를 불러오지 못했습니다.'))
  }, [activeRoom, activeUser])

  const sendMessage = async () => {
    if (!newMsg.trim() || !activeRoom || !activeUser) return
    const chatId = `${activeUser.userEmail}-${activeRoom.fileId}`
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: activeUser.userEmail,
          fileId: activeRoom.fileId,
          content: newMsg.trim(),
        }),
      })
      if (!res.ok) throw new Error('전송 실패')
      const sent: ChatMessage = await res.json()
      setMessages((prev) => [...prev, sent])
      setNewMsg('')
      mutate('/api/messages/unreadCount')
      const chats = await fetch('/api/messages/chats').then((r) => r.json())
      setChatList(chats)
    } catch {
      toast.error('메시지 전송에 실패했습니다.')
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const deleteMessage = async (msgId: string) => {
    if (!activeUser || !activeRoom) return
    try {
      const res = await fetch(`/api/messages/${msgId}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error('삭제 실패')
      setMessages((prev) => prev.filter((m) => m.id !== msgId))
      setSelectedMsgId(null)
      mutate('/api/messages/unreadCount')
      const chats = await fetch('/api/messages/chats').then((r) => r.json())
      setChatList(chats)
    } catch {
      toast.error('메시지 삭제에 실패했습니다.')
    }
  }

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
      const chats = await fetch('/api/messages/chats').then((r) => r.json())
      setChatList(chats)
    } catch {
      toast.error('메시지 수정에 실패했습니다.')
    }
  }

  const grouped = messages.reduce<Record<string, ChatMessage[]>>((acc, msg) => {
    const d = new Date(msg.timestamp).toLocaleDateString('ko-KR')
    if (!acc[d]) acc[d] = []
    acc[d].push(msg)
    return acc
  }, {})

  const handleBubbleClick = (msgId: string, e: MouseEvent) => {
    e.stopPropagation()
    setSelectedMsgId((prev) => (prev === msgId ? null : msgId))
    setEditingId(null)
  }

  useEffect(() => {
    const handleClickOutside = () => {
      setSelectedMsgId(null)
    }
    window.addEventListener('click', handleClickOutside)
    return () => {
      window.removeEventListener('click', handleClickOutside)
    }
  }, [])

  return (
    <div className="h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 flex h-full pt-4">
        {/* 왼쪽: 사용자 & 방 목록 */}
        <aside className="w-80 bg-white border border-gray-200 rounded-lg overflow-y-auto">
          <h2 className="p-4 font-semibold border-b text-gray-600">메시지</h2>
          {chatList.map((user) => {
            const totalUnread = user.rooms.reduce(
              (sum, r) => sum + r.unreadCount,
              0
            )
            const isActive = user.userEmail === activeUser?.userEmail
            const prof = userProfiles[user.userEmail]
            return (
              <div key={user.userEmail}>
                <div
                  onClick={() => setActiveUser(user)}
                  className={`flex items-center justify-between px-4 py-3 cursor-pointer ${
                    isActive ? 'bg-gray-100' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Image
                      src={prof?.avatarUrl || '/default-avatar.png'}
                      alt={prof?.name || user.userName}
                      width={40}
                      height={40}
                      className="rounded-full"
                    />
                    <div className="truncate">
                      <p className="text-purple-600 font-medium">
                        {prof?.name || user.userName}
                      </p>
                      <p className="text-gray-500 text-sm truncate">
                        {user.userEmail}
                      </p>
                    </div>
                  </div>
                  {totalUnread > 0 && (
                    <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-semibold text-white bg-red-600 rounded-full">
                      {totalUnread}
                    </span>
                  )}
                </div>
                {isActive && (
                  <ul className="pl-8 border-b border-gray-100">
                    {user.rooms.map((room) => (
                      <li
                        key={room.fileId}
                        onClick={() => setActiveRoom(room)}
                        className={`flex items-center justify-between px-4 py-2 cursor-pointer ${
                          activeRoom?.fileId === room.fileId
                            ? 'text-purple-600 font-medium'
                            : 'hover:text-purple-600 text-gray-700'
                        }`}
                      >
                        <span className="truncate">
                          {room.title || room.originalName}
                        </span>
                        {room.unreadCount > 0 && (
                          <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-semibold text-white bg-red-600 rounded-full">
                            {room.unreadCount}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )
          })}
        </aside>

        {/* 오른쪽: 채팅창 */}
        <section className="flex-1 flex flex-col ml-6 bg-white border border-gray-200 rounded-lg overflow-hidden">
          {/* 상단 헤더 */}
          <div className="flex items-center justify-between px-4 py-3 border-b">
            {profile ? (
              <div className="flex items-center space-x-3">
                <Image
                  src={profile.avatarUrl}
                  alt={profile.name}
                  width={40}
                  height={40}
                  className="rounded-full"
                />
                <div>
                  <p className="font-semibold text-purple-600">
                    {profile.name}
                  </p>
                  <p className="text-sm text-gray-500">{profile.email}</p>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">대화를 선택해 주세요</p>
            )}

            {activeRoom && (
              <Link
                href={`/file/${activeRoom.fileId}`}
                className="text-right hover:underline"
              >
                <p className="font-medium text-gray-800">{activeRoom.title}</p>
                <p className="text-sm text-gray-500">
                  {activeRoom.originalName}
                </p>
              </Link>
            )}
          </div>

          {/* 메시지 리스트 */}
          <div className="flex-1 p-4 overflow-y-auto space-y-6 ">
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
                      if (msg.author === 'me' && editingId !== msg.id)
                        handleBubbleClick(msg.id, e)
                    }}
                  >
                    {/* 상대방 아바타 */}
                    {msg.author === 'them' && (
                      <Image
                        src={profile?.avatarUrl || '/default-avatar.png'}
                        alt={profile?.name || ''}
                        width={32}
                        height={32}
                        className="rounded-full"
                      />
                    )}

                    {/* 메시지 – 편집 모드 분기 */}
                    <div className="max-w-[70%] relative">
                      {editingId === msg.id ? (
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
                        <div>
                          <div
                            className={`prose max-w-prose p-4 mt-2 rounded-lg whitespace-pre-wrap ${
                              msg.author === 'me'
                                ? 'ml-auto mb-0 bg-purple-100 text-purple-800'
                                : 'mb-0 bg-gray-100 text-gray-800'
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

                          {selectedMsgId === msg.id && (
                            <div className="flex space-x-2 mt-1 ml-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setEditingId(msg.id)
                                  setEditContent(msg.content)
                                  setSelectedMsgId(null)
                                }}
                                className="text-xs text-gray-500 hover:text-purple-600"
                                aria-label="편집"
                              >
                                수정
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  deleteMessage(msg.id)
                                }}
                                className="text-xs text-gray-500 hover:text-red-600"
                                aria-label="삭제"
                              >
                                삭제
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

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

          {/* 입력 폼 */}
          {activeRoom && (
            <form
              onSubmit={(e: FormEvent) => {
                e.preventDefault()
                sendMessage()
              }}
              className="p-4 border-t flex items-center space-x-3"
            >
              <textarea
                rows={1}
                value={newMsg}
                onChange={(e) => setNewMsg(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="메시지 입력... (Enter: 전송, Shift+Enter 줄바꿈)"
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-600"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
              >
                보내기
              </button>
            </form>
          )}
        </section>
      </div>
    </div>
  )
}
