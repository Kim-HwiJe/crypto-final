'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { Home, LogIn, LogOut, ArrowUp, Upload } from 'lucide-react'

const FloatingSidebar = () => {
  const [isExpanded, setIsExpanded] = useState(false)
  const router = useRouter()
  const { data: session } = useSession()

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div
      className={`fixed left-0 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-sm rounded-r-lg shadow-lg transition-all duration-300 ${
        isExpanded ? 'w-48' : 'w-12'
      }`}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
      style={{ zIndex: 1000 }}
    >
      <div
        className="flex flex-col items-center py-4 space-y-4"
        style={{ minWidth: isExpanded ? '12rem' : '3rem' }}
      >
        <Link
          href="/"
          className="flex items-center w-full px-3 hover:bg-gray-100/50 rounded-lg text-gray-600"
        >
          <Home className="w-6 h-6" />
          {isExpanded && <span className="ml-3 whitespace-nowrap">홈</span>}
        </Link>

        {!session ? (
          <Link
            href="/login"
            className="flex items-center w-full px-3 hover:bg-gray-100/50 rounded-lg text-gray-600"
          >
            <LogIn className="w-6 h-6" />
            {isExpanded && (
              <span className="ml-3 whitespace-nowrap">로그인</span>
            )}
          </Link>
        ) : (
          <>
            <Link
              href="/upload"
              className="flex items-center w-full px-3 hover:bg-gray-100/50 rounded-lg text-gray-600"
            >
              <Upload className="w-6 h-6" />
              {isExpanded && (
                <span className="ml-3 whitespace-nowrap">업로드</span>
              )}
            </Link>

            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="flex items-center w-full px-3 hover:bg-gray-100/50 rounded-lg text-gray-600"
            >
              <LogOut className="w-6 h-6" />
              {isExpanded && (
                <span className="ml-3 whitespace-nowrap">로그아웃</span>
              )}
            </button>
          </>
        )}

        <button
          onClick={scrollToTop}
          className="flex items-center w-full px-3 hover:bg-gray-100/50 rounded-lg text-gray-600"
        >
          <ArrowUp className="w-6 h-6" />
          {isExpanded && <span className="ml-3 whitespace-nowrap">Top</span>}
        </button>
      </div>
    </div>
  )
}

export default FloatingSidebar
