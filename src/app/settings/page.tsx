// src/app/settings/page.tsx
'use client'

import { useState, ChangeEvent, FormEvent, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { mutate } from 'swr'

interface ProfileUpdatePayload {
  name: string
  gender: string
  birthDate: string
  // avatar: file
}

export default function SettingsPage() {
  const { data: session } = useSession()
  const user = session?.user
  const router = useRouter()

  // 로컬 상태
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState(
    user?.image || '/default-avatar.png'
  )
  const [name, setName] = useState(user?.name || '')
  const [gender, setGender] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [statusMsg, setStatusMsg] = useState<string | null>(null)

  // 파일 선택 시 미리보기
  const handleAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setAvatarFile(file)
      setAvatarPreview(URL.createObjectURL(file))
    }
  }

  // 프로필 저장
  const handleSaveProfile = async (e: FormEvent) => {
    e.preventDefault()
    setStatusMsg(null)

    const formData = new FormData()
    formData.append('name', name)
    formData.append('gender', gender)
    formData.append('birthDate', birthDate)
    if (avatarFile) formData.append('avatar', avatarFile)

    const res = await fetch('/api/user/profile', {
      method: 'POST',
      body: formData,
    })
    const data = await res.json()
    if (res.ok) {
      setStatusMsg('프로필이 저장되었습니다.')
      mutate('/api/user/me')
    } else {
      setStatusMsg(data.message || '저장 중 오류가 발생했습니다.')
    }
  }

  // 비밀번호 변경
  const handleChangePassword = async (e: FormEvent) => {
    e.preventDefault()
    setStatusMsg(null)
    const res = await fetch('/api/user/password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ oldPassword, newPassword }),
    })
    const data = await res.json()
    if (res.ok) {
      setStatusMsg('비밀번호가 변경되었습니다.')
      setOldPassword('')
      setNewPassword('')
      mutate('/api/user/me')
    } else {
      setStatusMsg(data.message || '비밀번호 변경에 실패했습니다.')
    }
  }

  // 이메일 마스킹 헬퍼
  const maskEmail = (email: string) => {
    return email.replace(/^(.{2}).+(@.+)$/, '$1***$2')
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold text-gray-600">Setting</h1>

      {/* 프로필 섹션 */}
      <section className="bg-white p-6 rounded-lg shadow space-y-6">
        <h2 className="text-xl font-semibold text-purple-600">Profile</h2>
        <form onSubmit={handleSaveProfile} className="space-y-4">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <Image
              src={avatarPreview}
              alt="Avatar Preview"
              width={80}
              height={80}
              className="rounded-full border"
            />
            <label className="cursor-pointer px-3 py-1 bg-gray-100 rounded text-gray-600">
              Change Avatar
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="sr-only"
              />
            </label>
            <p className="text-sm text-gray-500">Avatar, at least 160×160</p>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full border-b border-gray-300 focus:outline-none focus:border-purple-500 text-gray-400"
              required
            />
          </div>

          {/* Gender */}
          <div>
            <label className="block text-sm font-medium text-purple-600">
              Gender
            </label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="mt-1 w-full border border-gray-300 rounded p-2 text-gray-400"
            >
              <option value="">Select gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Birth Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Birth Date
            </label>
            <input
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              className="mt-1 border border-gray-300 rounded p-2 text-gray-400"
            />
          </div>

          <button
            type="submit"
            className="mt-2 px-6 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
          >
            Save
          </button>
        </form>
      </section>

      {/* Account Info */}
      <section className="bg-white p-6 rounded-lg shadow space-y-4">
        {/* Email */}
        <div>
          <h3 className="text-sm font-medium text-gray-500">Email</h3>
          <p className="mt-1 text-gray-900">
            {user?.email && maskEmail(user.email)}
          </p>
        </div>
        {/* Phone */}
        <div>
          <h3 className="text-sm font-medium text-gray-500">Phone</h3>
          <button className="mt-1 text-purple-600">Click to bind phone</button>
        </div>
      </section>

      {/* Change Password */}
      <section className="bg-white p-6 rounded-lg shadow space-y-4">
        <h2 className="text-xl font-semibold text-purple-600">비밀번호 변경</h2>
        <form onSubmit={handleChangePassword} className="space-y-3">
          <div>
            <label className="block text-sm text-gray-500">
              Old password{' '}
              <span className="text-sm text-gray-400">
                (leave blank if not)
              </span>
            </label>
            <input
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              className="mt-1 w-full border border-gray-300 rounded p-2 "
              placeholder="Old password "
            />
          </div>
          <div>
            <label className="block text-sm text-gray-500 ">New password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="mt-1 w-full border border-gray-300 rounded p-2"
              placeholder="New password"
              required
            />
          </div>
          <button
            type="submit"
            className="px-6 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
          >
            비밀번호 변경
          </button>
        </form>
      </section>

      {/* 상태 메시지 */}
      {statusMsg && (
        <p className="text-center text-sm text-red-500">{statusMsg}</p>
      )}
    </div>
  )
}
