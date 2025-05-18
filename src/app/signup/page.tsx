'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

// 회원가입 API 호출 함수
async function registerUser(data: {
  name: string
  email: string
  password: string
}) {
  const res = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  return res.json()
}

const SignUpPage: React.FC = () => {
  const router = useRouter()
  const [name, setName] = useState<string>('')
  const [email, setEmail] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)
    const result = await registerUser({ name, email, password })
    setIsLoading(false)

    if (result.status === 400) {
      setError(result.message ?? '회원가입 중 오류가 발생했습니다.')
    } else {
      router.push('/login')
    }
  }

  return (
    <div className="min-h-screen flex items-start justify-center bg-gray-50 pt-20 px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-white p-8 rounded-lg shadow-md space-y-6"
      >
        <h1 className="text-2xl font-bold text-gray-900">Sign up</h1>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        {/* Name */}
        <div className="space-y-1">
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-800"
          >
            Name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="Your name"
            className="w-full px-4 py-2 bg-transparent border-b border-gray-300 rounded-t-md focus:outline-none focus:border-purple-600 text-gray-900 placeholder-gray-500"
          />
        </div>

        {/* Email */}
        <div className="space-y-1">
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-800"
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
            className="w-full px-4 py-2 bg-transparent border-b border-gray-300 focus:outline-none focus:border-purple-600 text-gray-900 placeholder-gray-500"
          />
        </div>

        {/* Password */}
        <div className="space-y-1">
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-800"
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
            className="w-full px-4 py-2 bg-transparent border-b border-gray-300 rounded-b-md focus:outline-none focus:border-purple-600 text-gray-900 placeholder-gray-500"
          />
        </div>

        {/* Submit 버튼 및 링크 */}
        <div className="flex items-center justify-between pt-4">
          <button
            type="submit"
            disabled={isLoading}
            className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-md transition disabled:opacity-50"
          >
            {isLoading ? 'Signing up...' : 'Sign up'}
          </button>
          <Link
            href="/login"
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Login with code
          </Link>
        </div>

        <p className="text-xs text-gray-500 pt-2">
          By signing up, you agree to our{' '}
          <Link href="/terms" className="text-purple-600 hover:underline">
            Terms of Service
          </Link>
        </p>
      </form>
    </div>
  )
}

export default SignUpPage
