'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import LikeButton from '@/components/LikeButton'
import QuestionModal from '@/components/QuestionModal'

interface Post {
  id: string
  authorName: string
  title: string
  summary: string
  tags: string
  likes: number
  createdAt: string
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('ja-JP', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

export default function DashboardPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({ posts: 0, engineers: 0, skills: 0 })
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [techSearch, setTechSearch] = useState('')
  const [questionPost, setQuestionPost] = useState<{ title: string; authorName: string } | null>(null)

  useEffect(() => {
    fetch('/api/posts')
      .then((r) => r.json())
      .then((data: Post[]) => {
        setPosts(data)
        const engineers = new Set(data.map((p) => p.authorName)).size
        const allTags = data.flatMap((p) => {
          try { return JSON.parse(p.tags) as string[] } catch { return [] }
        })
        setStats({ posts: data.length, engineers, skills: new Set(allTags).size })
        setLoading(false)
      })
  }, [])

  const tagRanking = useMemo(() => {
    const count: Record<string, { count: number; likes: number }> = {}
    for (const post of posts) {
      const tags = (() => { try { return JSON.parse(post.tags) as string[] } catch { return [] } })()
      for (const tag of tags) {
        if (!count[tag]) count[tag] = { count: 0, likes: 0 }
        count[tag].count += 1
        count[tag].likes += post.likes ?? 0
      }
    }
    return Object.entries(count)
      .sort(([, a], [, b]) => b.count !== a.count ? b.count - a.count : b.likes - a.likes)
      .slice(0, 10)
  }, [posts])

  const filteredPosts = useMemo(() => {
    let result = posts
    const query = techSearch.trim().toLowerCase()
    if (selectedTag) {
      result = result.filter((p) => {
        const tags = (() => { try { return JSON.parse(p.tags) as string[] } catch { return [] } })()
        return tags.includes(selectedTag)
      })
    } else if (query) {
      result = result.filter((p) => {
        const tags = (() => { try { return JSON.parse(p.tags) as string[] } catch { return [] } })()
        return (
          tags.some((t) => t.toLowerCase().includes(query)) ||
          p.title.toLowerCase().includes(query) ||
          p.summary.toLowerCase().includes(query)
        )
      })
    }
    return result
  }, [posts, selectedTag, techSearch])

  const handleTagClick = (tag: string) => {
    setTechSearch('')
    setSelectedTag((prev) => (prev === tag ? null : tag))
  }

  const clearFilter = () => {
    setSelectedTag(null)
    setTechSearch('')
  }

  const isFiltered = selectedTag !== null || techSearch.trim() !== ''

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <div className="mb-6 md:mb-8">
        <h1 className="text-2xl font-bold text-white">ナレッジ一覧</h1>
        <p className="text-slate-400 text-sm mt-1">現場エンジニアの最新ナレッジ</p>
      </div>

      <div className="grid grid-cols-3 gap-2 md:gap-4 mb-6 md:mb-8">
        {[
          { label: '総投稿数', value: stats.posts, icon: '📝', color: 'text-cyan-400', glow: 'shadow-cyan-500/10' },
          { label: 'エンジニア数', value: stats.engineers, icon: '👥', color: 'text-violet-400', glow: 'shadow-violet-500/10' },
          { label: 'スキル種別', value: stats.skills, icon: '⚡', color: 'text-emerald-400', glow: 'shadow-emerald-500/10' },
        ].map((s) => (
          <div key={s.label} className={`bg-[#1e293b] border border-[#334155] rounded-xl p-3 md:p-5 shadow-lg ${s.glow}`}>
            <div className="flex items-center gap-1 md:gap-2 text-slate-400 text-xs md:text-sm mb-1 md:mb-2">
              <span>{s.icon}</span>
              <span className="truncate">{s.label}</span>
            </div>
            <p className={`text-xl md:text-3xl font-black ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-6 items-start">
        {/* Left: posts */}
        <div className="flex-1 min-w-0">
          <div className="mb-4 space-y-2">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">🔍</span>
                <input
                  type="text"
                  placeholder="技術を検索..."
                  value={techSearch}
                  onChange={(e) => { setTechSearch(e.target.value); setSelectedTag(null) }}
                  className="w-full bg-[#1e293b] border border-[#334155] rounded-xl pl-8 pr-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/60 transition-colors"
                />
              </div>
              <Link href="/post" className="text-cyan-400 text-sm hover:text-cyan-300 transition-colors whitespace-nowrap">
                + 投稿する →
              </Link>
            </div>
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-base md:text-lg font-semibold text-white">
                {selectedTag ? (
                  <span>「<span className="text-cyan-400">{selectedTag}</span>」の投稿</span>
                ) : isFiltered ? (
                  <span>検索結果 <span className="text-slate-400 text-sm font-normal">({filteredPosts.length}件)</span></span>
                ) : '最新ナレッジ'}
              </h2>
              {isFiltered && (
                <button
                  onClick={clearFilter}
                  className="text-xs text-slate-400 hover:text-cyan-400 border border-[#334155] hover:border-cyan-500/40 px-2.5 py-1.5 rounded-lg transition-colors whitespace-nowrap"
                >
                  ✕ フィルター解除
                </button>
              )}
            </div>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-[#1e293b] border border-[#334155] rounded-xl p-5 animate-pulse">
                  <div className="h-4 bg-slate-700 rounded w-3/4 mb-3" />
                  <div className="h-3 bg-slate-700 rounded w-full mb-1.5" />
                  <div className="h-3 bg-slate-700 rounded w-4/6" />
                </div>
              ))}
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="text-center py-16 bg-[#1e293b] rounded-xl border border-[#334155]">
              {isFiltered ? (
                <>
                  <p className="text-slate-400 mb-3">該当する投稿が見つかりませんでした</p>
                  <button onClick={clearFilter} className="text-cyan-400 text-sm hover:text-cyan-300 transition-colors">
                    ← すべての投稿を見る
                  </button>
                </>
              ) : (
                <>
                  <p className="text-slate-400 mb-4">まだ投稿がありません</p>
                  <Link href="/post" className="bg-cyan-500 text-black px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-cyan-400 transition-colors">
                    最初の投稿を作成する
                  </Link>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredPosts.map((post) => {
                const tags = (() => { try { return JSON.parse(post.tags) as string[] } catch { return [] } })()
                return (
                  <div
                    key={post.id}
                    className="bg-[#1e293b] border border-[#334155] rounded-xl p-5 hover:border-cyan-500/40 transition-colors group"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <Link href={`/posts/${post.id}`} className="flex-1 min-w-0">
                        <h3 className="text-white font-medium text-sm mb-1 truncate group-hover:text-cyan-400 transition-colors">
                          {post.title}
                        </h3>
                        <p className="text-slate-400 text-xs mb-3 line-clamp-2">{post.summary}</p>
                        <div className="flex flex-wrap gap-1.5">
                          {tags.slice(0, 5).map((tag) => (
                            <button
                              key={tag}
                              onClick={(e) => { e.preventDefault(); handleTagClick(tag) }}
                              className={`inline-block text-xs px-2 py-0.5 rounded-full border transition-colors ${
                                selectedTag === tag
                                  ? 'bg-cyan-500/30 text-cyan-300 border-cyan-500/50'
                                  : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20 hover:bg-cyan-500/20'
                              }`}
                            >
                              {tag}
                            </button>
                          ))}
                        </div>
                      </Link>
                      <div className="flex-shrink-0 flex flex-col items-end gap-2">
                        <Link href={`/users/${encodeURIComponent(post.authorName)}`} className="flex flex-col items-end gap-0.5 group/author">
                          <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-violet-700 rounded-full flex items-center justify-center text-white text-xs font-bold">
                            {post.authorName[0]?.toUpperCase()}
                          </div>
                          <p className="text-slate-500 text-xs group-hover/author:text-violet-400 transition-colors">{post.authorName}</p>
                          <p className="text-slate-600 text-xs">{formatDate(post.createdAt)}</p>
                        </Link>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setQuestionPost({ title: post.title, authorName: post.authorName })}
                            className="hidden sm:block text-xs text-slate-500 border border-[#334155] hover:border-cyan-500/40 hover:text-cyan-400 px-2 py-1 rounded-lg transition-colors"
                          >
                            ❓ 質問
                          </button>
                          <LikeButton postId={post.id} initialLikes={post.likes ?? 0} />
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Right: ranking sidebar - hidden on mobile */}
        {!loading && tagRanking.length > 0 && (
          <div className="hidden md:block w-60 flex-shrink-0 sticky top-4">
            <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-4">
              <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <span>🏆</span> 人気の技術ランキング
              </h3>
              <div className="space-y-1.5">
                {tagRanking.map(([tag, data], index) => {
                  const maxCount = tagRanking[0][1].count
                  const barWidth = Math.round((data.count / maxCount) * 100)
                  const isSelected = selectedTag === tag
                  return (
                    <button
                      key={tag}
                      onClick={() => handleTagClick(tag)}
                      className={`w-full text-left rounded-lg px-2.5 py-2 transition-colors group ${
                        isSelected
                          ? 'bg-cyan-500/20 border border-cyan-500/40'
                          : 'hover:bg-slate-700/50 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-bold w-4 ${
                          index === 0 ? 'text-amber-400' :
                          index === 1 ? 'text-slate-300' :
                          index === 2 ? 'text-amber-600' :
                          'text-slate-500'
                        }`}>
                          {index + 1}
                        </span>
                        <span className={`text-xs font-medium flex-1 truncate ${isSelected ? 'text-cyan-300' : 'text-slate-300 group-hover:text-white'}`}>
                          {tag}
                        </span>
                        <span className="text-xs text-slate-500">{data.count}件</span>
                      </div>
                      <div className="ml-6 h-1 bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${isSelected ? 'bg-cyan-400' : 'bg-cyan-500/50 group-hover:bg-cyan-500/70'}`}
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                    </button>
                  )
                })}
              </div>
              {isFiltered && (
                <button
                  onClick={clearFilter}
                  className="mt-3 w-full text-xs text-slate-500 hover:text-cyan-400 transition-colors py-1"
                >
                  フィルター解除
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {questionPost && (
        <QuestionModal
          toName={questionPost.authorName}
          postTitle={questionPost.title}
          onClose={() => setQuestionPost(null)}
        />
      )}
    </div>
  )
}
