'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import toast from 'react-hot-toast'
import { Heart } from 'lucide-react'

interface FollowButtonProps {
  targetEmail: string
}

export default function FollowButton({ targetEmail }: FollowButtonProps) {
  const { data: session } = useSession()
  const me = session?.user?.email

  const [isFollowing, setIsFollowing] = useState(false)
  const [loading, setLoading] = useState(false)

  // 마운트 시 팔로우 상태 조회
  useEffect(() => {
    if (!me) return
    fetch('/api/user/me')
      .then((res) => {
        if (!res.ok) throw new Error('유저 정보를 불러오는 중 오류')
        return res.json()
      })
      .then((data) => {
        const following: string[] = Array.isArray(data.following)
          ? data.following
          : []
        setIsFollowing(following.includes(targetEmail))
      })
      .catch(console.error)
  }, [me, targetEmail])

  const toggleFollow = async () => {
    if (!me) {
      toast.error('로그인이 필요합니다.')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/user/follow', {
        method: isFollowing ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetEmail }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.message || '요청 실패')
      setIsFollowing(!isFollowing)
      toast.success(isFollowing ? '언팔로우했습니다.' : '팔로우했습니다.')
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={toggleFollow}
      disabled={loading}
      className={`
        flex items-center gap-1 px-4 py-1 rounded transition
        ${
          isFollowing
            ? 'bg-purple-600 text-white fill-current'
            : 'bg-white text-purple-600 border border-purple-600 stroke-current'
        }
        disabled:opacity-50
      `}
    >
      <Heart size={16} />
      {isFollowing ? '언팔로우' : '팔로우'}
    </button>
  )
}
