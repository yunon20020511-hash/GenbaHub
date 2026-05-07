'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
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

const TAG_COLORS = [
  'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  'bg-violet-500/10 text-violet-400 border-violet-500/20',
  'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  'bg-amber-500/10 text-amber-400 border-amber-500/20',
  'bg-rose-500/10 text-rose-400 border-rose-500/20',
]

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('ja-JP', {
    month: 'short', day: 'numeric',
  })
}

function formatDateFull(d: string) {
  return new Date(d).toLocaleDateString('ja-JP', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
}

export default function UserProfilePage() {
  const { name } = useParams<{ name: string }>()
  const decoded = decodeURIComponent(name)

  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [questionPost, setQuestionPost] = useState<{ title: string } | null>(null)

  useEffect(() => {
    fetch(`/api/posts?author=${encodeURIComponent(decoded)}`)
      .then((r) => r.json())
      .then((data: Post[]) => { setPosts(data); setLoading(false) })
  }, [decoded])

  const skillCount: Record<string, number> = {}
  for (const post of posts) {
    const tags = (() => { try { return JSON.parse(post.tags) as string[] } catch { return [] } })()
    for (const tag of tags) {
      skillCount[tag] = (skillCount[tag] ?? 0) + 1
    }
  }
  const skills = Object.entries(skillCount).sort(([, a], [, b]) => b - a)

  const lastActive = posts[0]?.createdAt

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
        <Link href="/skills" className="hover:text-slate-300 transition-colors">スキルマトリクス</Link>
        <span>/</span>
        <span className="text-slate-400">{decoded}</span>
      </div>

      {/* Profile header */}
      <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-6 mb-6">
        <div className="flex items-start gap-5">
          <div className="w-16 h-16 bg-violet-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
            {decoded[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-white mb-1">{decoded}</h1>
            {lastActive && (
              <p className="text-slate-500 text-sm mb-4">
                最終活動: {formatDateFull(lastActive)}
              </p>
            )}
            <div className="flex items-center gap-6 flex-wrap">
              <div className="text-center">
                <p className="text-2xl font-bold text-cyan-400">{posts.length}</p>
                <p className="text-slate-500 text-xs">投稿数</p>
              </div>
              <div className="w-px h-8 bg-[#334155]" />
              <div className="text-center">
                <p className="text-2xl font-bold text-violet-400">{skills.length}</p>
                <p className="text-slate-500 text-xs">スキル数</p>
              </div>
              <div className="w-px h-8 bg-[#334155]" />
              <div className="text-center">
                <p className="text-2xl font-bold text-rose-400">
                  {posts.reduce((s, p) => s + (p.likes ?? 0), 0)}
                </p>
                <p className="text-slate-500 text-xs">獲得いいね</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Skills */}
      {skills.length > 0 && (
        <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-5 mb-6">
          <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <span>⚡</span> スキルセット
          </h2>
          <div className="flex flex-wrap gap-2">
            {skills.map(([skill, count], i) => (
              <span
                key={skill}
                className={`inline-flex items-center gap-1.5 border text-sm px-3 py-1 rounded-full ${TAG_COLORS[i % TAG_COLORS.length]}`}
              >
                {skill}
                <span className="opacity-60 text-xs font-medium">{count}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Posts */}
      <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <span>📝</span> 投稿一覧
        <span className="text-slate-500 text-sm font-normal">({posts.length}件)</span>
      </h2>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-[#1e293b] border border-[#334155] rounded-xl p-5 animate-pulse">
              <div className="h-4 bg-slate-700 rounded w-3/4 mb-3" />
              <div className="h-3 bg-slate-700 rounded w-full mb-1" />
              <div className="h-3 bg-slate-700 rounded w-5/6" />
            </div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-12 text-slate-500">投稿がありません</div>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => {
            const tags = (() => { try { return JSON.parse(post.tags) as string[] } catch { return [] } })()
            const isOpen = expandedId === post.id
            return (
              <div
                key={post.id}
                className="bg-[#1e293b] border border-[#334155] rounded-xl overflow-hidden hover:border-cyan-500/30 transition-colors"
              >
                <button
                  className="w-full text-left p-5"
                  onClick={() => setExpandedId(isOpen ? null : post.id)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-slate-600 text-xs">{formatDate(post.createdAt)}</span>
                      </div>
                      <h3 className="text-white font-medium text-sm mb-1.5">{post.title}</h3>
                      <p className="text-slate-400 text-xs line-clamp-2 mb-2">{post.summary}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {tags.slice(0, 5).map((tag) => (
                          <span
                            key={tag}
                            className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-xs px-2 py-0.5 rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex-shrink-0 flex items-center gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); setQuestionPost({ title: post.title }) }}
                        className="text-xs text-slate-500 hover:text-cyan-400 border border-[#334155] hover:border-cyan-500/40 px-2 py-1 rounded-lg transition-colors"
                      >
                        ❓ 質問
                      </button>
                      <LikeButton postId={post.id} initialLikes={post.likes ?? 0} />
                      <Link
                        href={`/posts/${post.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-xs text-slate-500 hover:text-cyan-400 border border-[#334155] hover:border-cyan-500/40 px-2.5 py-1 rounded-lg transition-colors"
                      >
                        全文
                      </Link>
                      <span className="text-slate-600 text-xs">{isOpen ? '▲' : '▼'}</span>
                    </div>
                  </div>
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 border-t border-[#334155]">
                    <div className="mt-4">
                      <MarkdownContent content={post.content} />
                    </div>
                    {post.advice && (
                      <div className="mt-4 bg-violet-500/10 border border-violet-500/20 rounded-lg p-3 flex gap-2">
                        <span className="text-violet-400">💡</span>
                        <p className="text-violet-200 text-xs">{post.advice}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {questionPost && (
        <QuestionModal
          toName={decoded}
          postTitle={questionPost.title}
          onClose={() => setQuestionPost(null)}
        />
      )}
    </div>
  )
}
