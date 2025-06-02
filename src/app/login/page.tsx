// src/app/login/page.tsx
'use client'

import React, { useState, useEffect, useRef } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'

const LoginPage: React.FC = () => {
  const router = useRouter()
  const [email, setEmail] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)

  // 툴팁 표시 여부
  const [showTooltip, setShowTooltip] = useState<boolean>(false)
  const tooltipTimerRef = useRef<number | null>(null)

  // “비밀번호를 잊으셨나요?” 클릭 이벤트 핸들러
  const handleForgotClick = (e: React.MouseEvent) => {
    e.preventDefault()
    // 이미 타이머가 돌고 있으면 취소
    if (tooltipTimerRef.current) {
      clearTimeout(tooltipTimerRef.current)
    }
    setShowTooltip(true)
    // 3초 뒤 자동 숨김
    tooltipTimerRef.current = window.setTimeout(() => {
      setShowTooltip(false)
      tooltipTimerRef.current = null
    }, 3000)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    // next-auth CredentialsProvider 호출
    const res = await signIn('credentials', {
      redirect: false,
      email,
      password,
    })

    setIsLoading(false)

    if (res?.error) {
      // 에러 메시지에 따라 분기 처리
      if (res.error === 'USER_NOT_FOUND') {
        setError('없는 사용자입니다.')
      } else if (res.error === 'PASSWORD_INCORRECT') {
        setError('비밀번호가 잘못되었습니다.')
      } else {
        setError('로그인 중 오류가 발생했습니다.')
      }
      return
    }

    // 로그인 성공 시 홈으로 이동
    router.push('/')
  }

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (tooltipTimerRef.current) {
        clearTimeout(tooltipTimerRef.current)
      }
    }
  }, [])

  return (
    <div className="min-h-screen flex items-start justify-center bg-gray-50 pt-20 px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-white p-8 rounded-lg shadow-md space-y-6 relative"
      >
        <h1 className="text-2xl font-bold text-gray-900">Login</h1>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <div className="space-y-1">
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="you@example.com"
            className="w-full px-4 py-2 bg-blue-50 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-400 text-gray-900 placeholder-gray-500"
          />
        </div>

        <div className="space-y-1">
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-700"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="••••••••"
            className="w-full px-4 py-2 bg-blue-50 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-400 text-gray-900 placeholder-gray-500"
          />
        </div>

        <div className="flex items-center justify-between">
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition disabled:opacity-50"
          >
            {isLoading ? 'Loading...' : 'Login'}
          </button>

          {/* 툴팁을 띄우기 위한 상대 위치 요소 */}
          <div className="relative">
            <a
              href="#"
              onClick={handleForgotClick}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              비밀번호를 잊으셨나요?
            </a>

            {showTooltip && (
              <div className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 bg-white border border-gray-300 rounded-md px-3 py-2 shadow-lg whitespace-nowrap text-sm text-gray-800 z-10">
                정말 안타까워요 😢
              </div>
            )}
          </div>
        </div>
      </form>
    </div>
  )
}

export default LoginPage
