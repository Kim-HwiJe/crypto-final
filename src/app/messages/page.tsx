// src/app/messages/page.tsx
'use client'

import React, { useEffect, useState, FormEvent } from 'react'
import Image from 'next/image'
import { useSession } from 'next-auth/react'

type ChatSummary = {
  id: string
  name: string
  lastMessage: string
  date: string
  price?: string
  unread: boolean
  avatarUrl: string
}

type ChatMessage = {
  id: string
  author: 'me' | 'them'
  content: string
  timestamp: string
}

export default function MessagesPage() {
  const { data: session } = useSession()
  const [chats, setChats] = useState<ChatSummary[]>([])
  const [selectedChat, setSelectedChat] = useState<ChatSummary | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMsg, setNewMsg] = useState('')

  // 더미 데이터 — 실제 API로 교체하세요
  const mockChats: ChatSummary[] = [
    {
      id: '1',
      name: '더미데이터',
      lastMessage: '메시지 내용 테스트...',
      date: '2025-04-19T12:00:00',
      price: '암호화됨',
      unread: true,
      avatarUrl: '/default-avatar.png',
    },
    // … 기타 채팅 목록 …
  ]
  const mockMessages: Record<string, ChatMessage[]> = {
    '1': [
      {
        id: 'm1',
        author: 'them',
        content: '메시지기능용 더미데이터 입니다',
        timestamp: '2025-03-09T19:27:30',
      },
      // … 기타 메세지 …
    ],
  }

  useEffect(() => {
    setChats(mockChats)
    setSelectedChat(mockChats[0])
  }, [])

  useEffect(() => {
    if (!selectedChat) return
    setMessages(mockMessages[selectedChat.id] || [])
    // 읽음 처리
    setChats((chs) =>
      chs.map((c) => (c.id === selectedChat.id ? { ...c, unread: false } : c))
    )
  }, [selectedChat])

  const handleSend = (e: FormEvent) => {
    e.preventDefault()
    if (!newMsg.trim() || !selectedChat) return
    const msg: ChatMessage = {
      id: Date.now().toString(),
      author: 'me',
      content: newMsg.trim(),
      timestamp: new Date().toISOString(),
    }
    setMessages((ms) => [...ms, msg])
    setNewMsg('')
  }

  // 날짜별 그룹핑
  const grouped = messages.reduce<Record<string, ChatMessage[]>>((acc, msg) => {
    const date = new Date(msg.timestamp).toLocaleDateString('ko-KR')
    if (!acc[date]) acc[date] = []
    acc[date].push(msg)
    return acc
  }, {})

  return (
    <div className="h-screen bg-gray-50">
      {/* 헤더와 동일한 좌우 여백 */}
      <div className="max-w-7xl mx-auto px-6 flex h-full pt-4">
        {/* 왼쪽 채팅 목록 */}
        <aside className="w-80 bg-white border border-gray-200 rounded-lg overflow-y-auto">
          <h2 className="p-4 font-semibold border-b text-gray-600">메시지</h2>
          <ul>
            {chats.map((chat) => (
              <li
                key={chat.id}
                onClick={() => setSelectedChat(chat)}
                className={`flex items-center p-4 cursor-pointer hover:bg-gray-100 ${
                  selectedChat?.id === chat.id && 'bg-gray-100 text-purple-600'
                }`}
              >
                <Image
                  src={chat.avatarUrl}
                  alt={chat.name}
                  width={40}
                  height={40}
                  className="rounded-full"
                />
                <div className="ml-3 flex-1">
                  <p className="font-medium ">{chat.name}</p>
                  <p className="text-sm text-gray-500 truncate">
                    {chat.lastMessage}
                  </p>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-xs text-gray-400">
                    {new Date(chat.date).toLocaleDateString('ko-KR')}
                  </span>
                  {chat.price && (
                    <span className="text-green-600 text-sm">{chat.price}</span>
                  )}
                  {chat.unread && (
                    <span className="mt-1 block w-2 h-2 bg-red-500 rounded-full" />
                  )}
                </div>
              </li>
            ))}
          </ul>
        </aside>

        {/* 오른쪽 대화창 */}
        <section className="flex-1 flex flex-col ml-6 bg-white border border-gray-200 rounded-lg overflow-hidden">
          {/* 대화 상단 */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center space-x-3">
              <Image
                src={selectedChat?.avatarUrl || '/default-avatar.png'}
                alt=""
                width={40}
                height={40}
                className="rounded-full"
              />
              <div>
                <p className="font-semibold text-purple-600">
                  {selectedChat?.name}
                </p>
                {selectedChat?.price && (
                  <p className="text-sm text-green-600">{selectedChat.price}</p>
                )}
              </div>
            </div>
            <span className="text-xs text-gray-400">
              {selectedChat &&
                new Date(selectedChat.date).toLocaleDateString('ko-KR', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                })}
            </span>
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
                    className="flex items-start space-x-2 text-gray-700 mt-2"
                  >
                    {msg.author === 'them' && (
                      <Image
                        src={selectedChat?.avatarUrl || '/default-avatar.png'}
                        alt=""
                        width={32}
                        height={32}
                        className="rounded-full"
                      />
                    )}
                    <div
                      className={`prose max-w-prose ${
                        msg.author === 'me'
                          ? 'ml-auto bg-purple-100'
                          : 'bg-gray-100'
                      } p-4 rounded-lg whitespace-pre-wrap`}
                    >
                      {msg.content}
                      <div className="text-right text-xs text-gray-400 mt-1">
                        {new Date(msg.timestamp).toLocaleTimeString('ko-KR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                    {msg.author === 'me' && (
                      <Image
                        src={session?.user?.image || '/default-avatar.png'}
                        alt="Me"
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

          {/* 답장 인풋 */}
          <form
            onSubmit={handleSend}
            className="p-4 border-t flex items-center space-x-3"
          >
            <textarea
              rows={1}
              value={newMsg}
              onChange={(e) => setNewMsg(e.target.value)}
              placeholder="메시지 입력..."
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
