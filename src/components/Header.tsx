'use client'

import Link from 'next/link'
import Image from 'next/image'
import {
  Home,
  Compass,
  Search,
  Upload,
  Mail,
  MessageCircle,
  Heart,
  ChevronRight,
} from 'lucide-react'
import React, { useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import useSWR from 'swr'
import { useRouter } from 'next/navigation'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

const Header: React.FC = () => {
  const { data: session } = useSession()
  const shouldFetch = Boolean(session)

  const { data: unreadData } = useSWR(
    shouldFetch ? '/api/messages/unreadCount' : null,
    fetcher
  )
  const unreadCount = unreadData?.count ?? 0

  const { data: user } = useSWR(shouldFetch ? '/api/user/me' : null, fetcher)

  const [isMsgMenuOpen, setIsMsgMenuOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [searchType, setSearchType] = useState<'user' | 'file'>('user')
  const [searchQuery, setSearchQuery] = useState('')
  const router = useRouter()

  const handleSearch = () => {
    const q = searchQuery.trim()
    if (q) {
      router.push(`/search?query=${encodeURIComponent(q)}&type=${searchType}`)
    }
  }

  const onKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSearch()
    }
  }

  return (
    <header className="w-full bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.png" alt="SafeShare Logo" width={32} height={32} />
          <span className="text-2xl font-bold text-purple-600">SafeShare</span>
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center space-x-6 ml-8">
          <Link
            href="/"
            className="flex items-center gap-1 text-gray-700 hover:text-purple-600 transition"
          >
            <Home size={18} /> Home
          </Link>
          <Link
            href="/file"
            className="flex items-center gap-1 text-gray-700 hover:text-purple-600 transition"
          >
            <Compass size={18} /> Explore
          </Link>
          {/* Search */}
          <div className="flex-shrink flex items-center space-x-2 bg-gray-100 rounded-lg px-3 py-1">
            <Search size={16} className="text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Search..."
              className="bg-transparent focus:outline-none text-gray-600 flex-grow"
            />
            <select
              value={searchType}
              onChange={(e) => setSearchType(e.target.value as any)}
              className="bg-transparent text-gray-600 outline-none"
            >
              <option value="user">사용자</option>
              <option value="file">파일</option>
            </select>
            <button
              onClick={handleSearch}
              className="px-2 font-medium text-purple-600 hover:text-purple-700"
            >
              검색
            </button>
          </div>
        </nav>

        <div className="ml-auto flex items-center space-x-4">
          {!session && (
            <>
              <Link
                href="/login"
                className="text-gray-700 hover:text-purple-600"
              >
                Login
              </Link>
              <Link
                href="/signup"
                className="bg-purple-600 text-white px-4 py-1 rounded-lg hover:bg-purple-700"
              >
                Signup
              </Link>
            </>
          )}

          {session && (
            <>
              <Link
                href="/upload"
                className="flex items-center gap-1 text-gray-700 hover:text-purple-600 transition"
              >
                <Upload size={18} /> 업로드
              </Link>

              <div
                className="relative"
                onMouseEnter={() => setIsMsgMenuOpen(true)}
                onMouseLeave={() => setIsMsgMenuOpen(false)}
              >
                <Mail
                  size={20}
                  className="cursor-pointer text-gray-700 hover:text-purple-600 transition"
                />

                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 inline-flex items-center justify-center w-5 h-5 text-xs font-semibold text-white bg-red-600 rounded-full">
                    {unreadCount}
                  </span>
                )}

                {isMsgMenuOpen && (
                  <div className="absolute right-0 mt-0 w-48 bg-white shadow-lg rounded-md z-20">
                    <ul className="divide-y divide-gray-100">
                      <li>
                        <Link
                          href="/mymessages"
                          className="flex items-center justify-between px-4 py-2 hover:bg-gray-50"
                        >
                          <div className="flex items-center space-x-2 text-gray-700">
                            <MessageCircle size={16} />
                            <span>메시지함</span>
                          </div>
                          {unreadCount > 0 && (
                            <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-semibold text-white bg-red-600 rounded-full">
                              {unreadCount}
                            </span>
                          )}
                          <ChevronRight size={16} className="text-gray-400" />
                        </Link>
                      </li>
                    </ul>
                  </div>
                )}
              </div>

              <span className="font-medium text-gray-800">
                {session.user?.name}
              </span>

              <div
                className="relative"
                onMouseEnter={() => setIsUserMenuOpen(true)}
                onMouseLeave={() => setIsUserMenuOpen(false)}
              >
                <Image
                  src={session.user?.image || '/default-avatar.png'}
                  alt="User Avatar"
                  width={32}
                  height={32}
                  className="rounded-full cursor-pointer"
                />
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-0 w-48 bg-white shadow-lg rounded-md z-10">
                    <ul className="py-2">
                      <li>
                        <Link
                          href="/user/me"
                          className="block px-4 py-2 hover:bg-gray-100 text-gray-700"
                        >
                          My Page
                        </Link>
                      </li>

                      <li>
                        <Link
                          href="/settings"
                          className="block px-4 py-2 hover:bg-gray-100 text-gray-700"
                        >
                          Settings
                        </Link>
                      </li>
                      <li>
                        <Link
                          href="/crypto-intro"
                          className="block px-4 py-2 hover:bg-gray-100 text-gray-700"
                        >
                          암호화 기술에 대해
                        </Link>
                      </li>
                      <li>
                        <button
                          onClick={() => signOut({ callbackUrl: '/' })}
                          className="w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700"
                        >
                          Logout
                        </button>
                      </li>
                    </ul>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}

export default Header
