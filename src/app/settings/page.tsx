// src/app/settings/page.tsx
'use client'

import { useState, ChangeEvent, FormEvent } from 'react'
import { useSession, signOut } from 'next-auth/react'
import Image from 'next/image'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'
import { mutate } from 'swr'
import { EyeOff } from 'lucide-react'

export default function SettingsPage() {
  const { data: session } = useSession()
  const user = session?.user
  const router = useRouter()

  // ─── 프로필 업데이트 상태 ─────────────────────────
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

  const handleAvatarChange = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) {
      setAvatarFile(f)
      setAvatarPreview(URL.createObjectURL(f))
    }
  }

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
      toast.success('프로필이 저장되었습니다.')
      mutate('/api/user/me')
    } else {
      toast.error(data.message || '저장 중 오류가 발생했습니다.')
    }
  }

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
      toast.success('비밀번호가 변경되었습니다.')
      setOldPassword('')
      setNewPassword('')
      mutate('/api/user/me')
    } else {
      toast.error(data.message || '비밀번호 변경에 실패했습니다.')
    }
  }

  const maskEmail = (email: string) =>
    email.replace(/^(.{2}).+(@.+)$/, '$1***$2')

  // ─── 탈퇴하기 로직 ────────────────────────────────
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deletePwd, setDeletePwd] = useState('')
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const handleDeleteClick = () => {
    setConfirmDelete(true)
    setDeleteError(null)
  }

  const handleConfirmDelete = async (e: FormEvent) => {
    e.preventDefault()
    if (!deletePwd) {
      setDeleteError('현재 비밀번호를 입력해주세요.')
      return
    }
    setDeleteLoading(true)
    setDeleteError(null)

    try {
      const res = await fetch('/api/user/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: deletePwd }),
      })
      const data = await res.json()

      if (!res.ok) {
        setDeleteError(data.message || '탈퇴에 실패했습니다.')
        return
      }
      toast.success('탈퇴가 완료되었습니다.')
      // 로그아웃 후 홈으로
      signOut({ callbackUrl: '/' })
    } catch (err) {
      console.error(err)
      setDeleteError('서버 오류가 발생했습니다.')
    } finally {
      setDeleteLoading(false)
    }
  }
  // ────────────────────────────────────────────────

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold text-gray-600">Setting</h1>

      {/* 프로필 섹션 */}
      <section className="bg-white p-6 rounded-lg shadow space-y-6">
        <h2 className="text-xl font-semibold text-purple-600">Profile</h2>
        <form onSubmit={handleSaveProfile} className="space-y-4">
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
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full border-b border-gray-300 focus:outline-none focus:border-purple-500 text-gray-800"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-purple-600">
              Gender
            </label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="mt-1 w-full border border-gray-300 rounded p-2 text-gray-800"
            >
              <option value="">Select gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Birth Date
            </label>
            <input
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              className="mt-1 border border-gray-300 rounded p-2 text-gray-800"
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
        <div>
          <h3 className="text-sm font-medium text-gray-500">Email</h3>
          <p className="mt-1 text-gray-900">
            {user?.email && maskEmail(user.email)}
          </p>
        </div>
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
              className="mt-1 w-full border border-gray-300 rounded p-2"
              placeholder="Old password"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-500">New password</label>
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

      {/* ─── 탈퇴하기 섹션 ──────────────────────── */}
      <section className="bg-white p-6 rounded-lg shadow space-y-4">
        <h2 className="text-xl font-semibold text-red-600">계정 탈퇴</h2>

        {!confirmDelete ? (
          <button
            onClick={handleDeleteClick}
            className="px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            탈퇴하기
          </button>
        ) : (
          <form onSubmit={handleConfirmDelete} className="space-y-3">
            <p className="text-sm text-red-600">
              정말 탈퇴하시겠습니까? 지금까지 업로드한 파일도 모두 삭제됩니다.
              <br />
              탈퇴하시려면 현재 비밀번호를 입력해 주세요.
            </p>
            <div className="relative">
              <input
                type="password"
                value={deletePwd}
                onChange={(e) => setDeletePwd(e.target.value)}
                placeholder="현재 비밀번호"
                className="w-full border border-gray-300 rounded px-3 py-2 pr-10"
                required
              />
              <button
                type="button"
                className="absolute inset-y-0 right-2 flex items-center"
                onClick={() => setDeletePwd('')}
              >
                <EyeOff size={20} className="text-gray-500" />
              </button>
            </div>
            {deleteError && (
              <p className="text-sm text-red-500">{deleteError}</p>
            )}
            <button
              type="submit"
              disabled={deleteLoading}
              className="px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
            >
              {deleteLoading ? '탈퇴 중…' : '탈퇴 확정'}
            </button>
          </form>
        )}
      </section>
    </div>
  )
}
