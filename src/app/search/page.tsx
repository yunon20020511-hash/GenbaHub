'use client'

import { useEffect, useState } from 'react'
import MarkdownContent from '@/components/MarkdownContent'
import Link from 'next/link'

interface Post {
  id: string
  authorName: string
  title: string
  summary: string
  content: string
  tags: string
  advice?: string
  createdAt: string
}

interface RelatedPost {
  id: string
  title: string
  summary: string
  authorName: string
  tags: string[]
}

interface AiAdvice {
  advice: string
  relatedSkills: string[]
  steps: string[]
  relatedPosts: RelatedPost[]
}

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Post[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [aiAdvice, setAiAdvice] = useState<AiAdvice | null>(null)
  const [adviceLoading, setAdviceLoading] = useState(false)

  useEffect(() => {
    if (!searched || loading || results.length > 0 || !query.trim()) {
      setAiAdvice(null)
      return
    }
    setAdviceLoading(true)
    fetch('/api/ai/advice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    })
      .then((r) => r.json())
      .then(setAiAdvice)
      .finally(() => setAdviceLoading(false))
  }, [searched, loading, results.length, query])

  async function handleSearch() {
    if (!query.trim()) return
    setLoading(true)
    setSearched(true)
    setAiAdvice(null)
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
      setResults(await res.json())
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">現場あるある解決 Bot</h1>
        <p className="text-slate-400 text-sm mt-1">
          過去の全投稿から解決策を検索。見つからなければ AI がアドバイス
        </p>
      </div>

      <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-5 mb-6">
        <label className="block text-xs text-slate-500 mb-2 uppercase tracking-wide">
          エラーや課題を入力
        </label>
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSearch() }
          }}
          placeholder="例: Docker コンテナが起動しない、React の useEffect が無限ループする..."
          className="w-full h-28 bg-[#0f172a] text-white text-sm rounded-xl p-4 outline-none border border-[#334155] focus:border-cyan-500/50 resize-none placeholder:text-slate-600"
        />
        <div className="flex justify-end mt-3">
          <button
            onClick={handleSearch}
            disabled={!query.trim() || loading}
            className="bg-cyan-500 text-black px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-cyan-400 disabled:opacity-40 transition-colors"
          >
            {loading ? '検索中...' : '検索する 🔍'}
          </button>
        </div>
      </div>

      {!searched && (
        <div className="text-center py-12 text-slate-600">
          <div className="text-5xl mb-3">🤖</div>
          <p>チームのナレッジから解決策を探します</p>
          <p className="text-xs mt-2">見つからない場合は Genba Hub AI がアドバイス</p>
        </div>
      )}

      {/* Direct search results */}
      {searched && !loading && results.length > 0 && (
        <div>
          <p className="text-slate-500 text-sm mb-4">{results.length}件の関連ナレッジが見つかりました</p>
          <div className="space-y-3">
            {results.map((post) => {
              const tags = (() => { try { return JSON.parse(post.tags) as string[] } catch { return [] } })()
              const isOpen = expanded === post.id
              return (
                <div key={post.id} className="bg-[#1e293b] border border-[#334155] rounded-xl overflow-hidden hover:border-cyan-500/30 transition-colors">
                  <button className="w-full text-left p-5" onClick={() => setExpanded(isOpen ? null : post.id)}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-medium text-sm mb-1">{post.title}</h3>
                        <p className="text-slate-400 text-xs mb-2 line-clamp-2">{post.summary}</p>
                        <div className="flex flex-wrap gap-1.5">
                          {tags.slice(0, 4).map((tag) => (
                            <span key={tag} className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-xs px-2 py-0.5 rounded-full">{tag}</span>
                          ))}
                        </div>
                      </div>
                      <div className="flex-shrink-0 text-right">
                        <div className="w-7 h-7 bg-gradient-to-br from-violet-500 to-violet-700 rounded-full flex items-center justify-center text-white text-xs font-bold mb-1 ml-auto">
                          {post.authorName[0]?.toUpperCase()}
                        </div>
                        <p className="text-slate-500 text-xs">{post.authorName}</p>
                        <span className="text-slate-600 text-xs">{isOpen ? '▲' : '▼'}</span>
                      </div>
                    </div>
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 border-t border-[#334155]">
                      <div className="mt-4"><MarkdownContent content={post.content} /></div>
                      {post.advice && (
                        <div className="mt-4 bg-violet-500/10 border border-violet-500/20 rounded-xl p-3 flex gap-2">
                          <span className="text-violet-400">💡</span>
                          <p className="text-violet-200 text-xs">{post.advice}</p>
                        </div>
                      )}
                      <div className="mt-4 pt-3 border-t border-[#334155] flex items-center justify-between">
                        <Link href={`/users/${encodeURIComponent(post.authorName)}`} className="flex items-center gap-2 text-xs text-slate-500 hover:text-violet-400 transition-colors">
                          <div className="w-5 h-5 bg-violet-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                            {post.authorName[0]?.toUpperCase()}
                          </div>
                          {post.authorName}のプロフィール
                        </Link>
                        <Link href={`/posts/${post.id}`} className="text-xs text-cyan-500 hover:text-cyan-400 transition-colors">全文を見る →</Link>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* No results → AI advice + related posts from DB */}
      {searched && !loading && results.length === 0 && (
        <div>
          <p className="text-slate-500 text-sm mb-5">
            チームのナレッジに「{query}」の完全一致は見つかりませんでした
          </p>

          {adviceLoading ? (
            <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-6 animate-pulse">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-slate-700 rounded-full" />
                <div className="h-4 bg-slate-700 rounded w-40" />
              </div>
              <div className="space-y-2">
                <div className="h-3 bg-slate-700 rounded w-full" />
                <div className="h-3 bg-slate-700 rounded w-5/6" />
                <div className="h-3 bg-slate-700 rounded w-4/6" />
              </div>
            </div>
          ) : aiAdvice ? (
            <div className="space-y-4">
              {/* Related posts from DB (tag match) */}
              {aiAdvice.relatedPosts?.length > 0 && (
                <div className="bg-[#1e293b] border border-emerald-500/20 rounded-xl p-5">
                  <p className="text-emerald-400 text-xs font-semibold uppercase tracking-wide mb-3">
                    関連タグのナレッジ（{aiAdvice.relatedPosts.length}件）
                  </p>
                  <div className="space-y-3">
                    {aiAdvice.relatedPosts.map((post) => (
                      <Link
                        key={post.id}
                        href={`/posts/${post.id}`}
                        className="block bg-[#0f172a] border border-[#334155] hover:border-emerald-500/30 rounded-xl p-4 transition-colors group"
                      >
                        <p className="text-white text-sm font-medium mb-1 group-hover:text-emerald-400 transition-colors">
                          {post.title}
                        </p>
                        <p className="text-slate-500 text-xs mb-2 line-clamp-2">{post.summary}</p>
                        <div className="flex flex-wrap gap-1.5">
                          {post.tags.slice(0, 4).map((tag) => (
                            <span key={tag} className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs px-2 py-0.5 rounded-full">
                              {tag}
                            </span>
                          ))}
                        </div>
                        <p className="text-slate-600 text-xs mt-2">{post.authorName} の投稿</p>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Advice card */}
              <div className="bg-gradient-to-br from-cyan-500/10 to-violet-500/10 border border-cyan-500/20 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-lg flex items-center justify-center text-black font-black text-xs">G</div>
                  <p className="text-cyan-400 text-sm font-semibold">Genba Hub AI のアドバイス</p>
                </div>
                <p className="text-slate-200 text-sm leading-relaxed">{aiAdvice.advice}</p>
              </div>

              {/* Steps */}
              {aiAdvice.steps?.length > 0 && (
                <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-5">
                  <p className="text-white text-sm font-semibold mb-3">試してみるアプローチ</p>
                  <ol className="space-y-2">
                    {aiAdvice.steps.map((step, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <span className="w-5 h-5 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        <span className="text-slate-300 text-sm">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {/* Related skills */}
              {aiAdvice.relatedSkills?.length > 0 && (
                <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-5">
                  <p className="text-white text-sm font-semibold mb-3">関連技術</p>
                  <div className="flex flex-wrap gap-2">
                    {aiAdvice.relatedSkills.map((skill) => (
                      <span key={skill} className="bg-violet-500/10 text-violet-400 border border-violet-500/20 text-sm px-3 py-1 rounded-full">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* CTA */}
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-emerald-400 text-sm font-medium">解決できたら共有しよう！</p>
                  <p className="text-slate-500 text-xs mt-0.5">あなたの解決策が次の誰かを助けます</p>
                </div>
                <Link
                  href="/post"
                  className="bg-emerald-500 text-black px-4 py-2 rounded-xl text-sm font-semibold hover:bg-emerald-400 transition-colors flex-shrink-0"
                >
                  投稿する →
                </Link>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}
