'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import MarkdownContent from '@/components/MarkdownContent'
import LikeButton from '@/components/LikeButton'
import QuestionModal from '@/components/QuestionModal'

interface Post {
  id: string
  authorName: string
  title: string
  summary: string
  content: string
  tags: string
  advice?: string
  likes: number
  createdAt: string
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('ja-JP', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function PostDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [showQuestion, setShowQuestion] = useState(false)

  useEffect(() => {
    fetch(`/api/posts/${id}`)
      .then((r) => {
        if (r.status === 404) { setNotFound(true); setLoading(false); return null }
        return r.json()
      })
      .then((data) => { if (data) { setPost(data); setLoading(false) } })
  }, [id])

  if (loading) {
    return (
      <div className="p-8 max-w-3xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-slate-700 rounded w-32" />
          <div className="h-8 bg-slate-700 rounded w-3/4" />
          <div className="h-4 bg-slate-700 rounded w-full" />
          <div className="h-4 bg-slate-700 rounded w-5/6" />
        </div>
      </div>
    )
  }

  if (notFound || !post) {
    return (
      <div className="p-8 max-w-3xl mx-auto text-center py-20">
        <p className="text-slate-400 mb-4">投稿が見つかりませんでした</p>
        <button onClick={() => router.back()} className="text-cyan-400 hover:text-cyan-300 text-sm">
          ← 戻る
        </button>
      </div>
    )
  }

  const tags = (() => { try { return JSON.parse(post.tags) as string[] } catch { return [] } })()

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
        <Link href="/" className="hover:text-slate-300 transition-colors">ダッシュボード</Link>
        <span>/</span>
        <span className="text-slate-400 truncate">{post.title}</span>
      </div>

      {/* Title */}
      <h1 className="text-2xl font-bold text-white mb-4 leading-tight">{post.title}</h1>

      {/* Meta */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-6 border-b border-[#334155]">
        <div className="flex items-center gap-3 flex-wrap">
          <Link href={`/users/${encodeURIComponent(post.authorName)}`} className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-violet-700 rounded-full flex items-center justify-center text-white text-sm font-bold group-hover:from-violet-400 transition-all">
              {post.authorName[0]?.toUpperCase()}
            </div>
            <span className="text-slate-300 text-sm group-hover:text-violet-400 transition-colors">{post.authorName}</span>
          </Link>
          <span className="text-slate-600 text-xs">{formatDate(post.createdAt)}</span>
        </div>
        <div className="flex items-center gap-2">
          <LikeButton postId={post.id} initialLikes={post.likes ?? 0} />
          <button
            onClick={() => setShowQuestion(true)}
            className="flex items-center gap-1.5 text-xs text-slate-500 border border-[#334155] hover:border-cyan-500/40 hover:text-cyan-400 px-3 py-1.5 rounded-lg transition-colors"
          >
            ❓ 質問を送る
          </button>
        </div>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-2 mb-6">
        {tags.map((tag) => (
          <span
            key={tag}
            className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-xs px-3 py-1 rounded-full"
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Summary */}
      <div className="bg-[#1e293b] border-l-2 border-cyan-500 rounded-r-xl px-5 py-4 mb-6">
        <p className="text-xs text-cyan-500 uppercase tracking-wide font-medium mb-1">要約</p>
        <p className="text-slate-300 text-sm leading-relaxed">{post.summary}</p>
      </div>

      {/* Content */}
      <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-6 mb-6">
        <MarkdownContent content={post.content} />
      </div>

      {/* Advice */}
      {post.advice && (
        <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl p-4 mb-6 flex items-start gap-3">
          <span className="text-violet-400 text-lg mt-0.5">💡</span>
          <div>
            <p className="text-violet-300 text-xs font-medium uppercase tracking-wide mb-1">AIアドバイス</p>
            <p className="text-violet-200 text-sm leading-relaxed">{post.advice}</p>
          </div>
        </div>
      )}

      {/* Raw input (collapsible) */}
      <details className="group">
        <summary className="text-xs text-slate-600 cursor-pointer hover:text-slate-400 transition-colors select-none">
          元のメモを見る ▸
        </summary>
      </details>

      {/* Footer nav */}
      <div className="flex justify-between mt-8 pt-6 border-t border-[#334155]">
        <button onClick={() => router.back()} className="text-sm text-slate-400 hover:text-slate-200 transition-colors">
          ← 戻る
        </button>
        <Link href={`/users/${encodeURIComponent(post.authorName)}`} className="text-sm text-violet-400 hover:text-violet-300 transition-colors">
          {post.authorName}の他の投稿 →
        </Link>
      </div>

      {showQuestion && (
        <QuestionModal
          toName={post.authorName}
          postTitle={post.title}
          onClose={() => setShowQuestion(false)}
        />
      )}
    </div>
  )
}
