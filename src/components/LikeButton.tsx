'use client'

import { useEffect, useState } from 'react'

interface Props {
  postId: string
  initialLikes: number
}

export default function LikeButton({ postId, initialLikes }: Props) {
  const [likes, setLikes] = useState(initialLikes)
  const [liked, setLiked] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    try {
      const stored: string[] = JSON.parse(localStorage.getItem('gh_liked') ?? '[]')
      setLiked(stored.includes(postId))
    } catch {
      // ignore
    }
  }, [postId])

  async function handleLike(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (liked || loading) return
    setLoading(true)
    try {
      const res = await fetch(`/api/posts/${postId}/like`, { method: 'POST' })
      if (res.ok) {
        const stored: string[] = JSON.parse(localStorage.getItem('gh_liked') ?? '[]')
        localStorage.setItem('gh_liked', JSON.stringify([...stored, postId]))
        setLiked(true)
        setLikes((n) => n + 1)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleLike}
      disabled={liked || loading}
      className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-all select-none ${
        liked
          ? 'bg-rose-500/10 text-rose-400 border-rose-500/20 cursor-default'
          : 'text-slate-500 border-[#334155] hover:bg-rose-500/10 hover:text-rose-400 hover:border-rose-500/20 cursor-pointer'
      }`}
    >
      <span className="text-sm leading-none">{liked ? '♥' : '♡'}</span>
      <span>{likes}</span>
    </button>
  )
}
