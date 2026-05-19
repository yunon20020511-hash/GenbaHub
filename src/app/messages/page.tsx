'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'

interface Message {
  id: string
  fromName: string
  toName: string
  content: string
  isRead: boolean
  createdAt: string
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('ja-JP', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

function parseQuestion(content: string) {
  const match = content.match(/^【質問】(.+?)\n\n([\s\S]+)$/)
  if (match) return { postTitle: match[1], body: match[2] }
  return { postTitle: null, body: content }
}

export default function MessagesPage() {
  const { data: session, status } = useSession()
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    if (status !== 'authenticated') return
    setLoading(true)
    fetch('/api/messages')
      .then((r) => r.json())
      .then((data: Message[]) => { setMessages(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [status])

  async function markRead(id: string) {
    await fetch('/api/messages', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setMessages((prev) => prev.map((m) => m.id === id ? { ...m, isRead: true } : m))
  }

  function toggleExpand(id: string, isRead: boolean) {
    setExpanded((prev) => (prev === id ? null : id))
    if (!isRead) markRead(id)
  }

  if (status === 'loading') {
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="bg-[#1e293b] border border-[#334155] rounded-xl p-5 animate-pulse">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-slate-700 rounded-full" />
                <div className="h-4 bg-slate-700 rounded w-32" />
              </div>
              <div className="h-3 bg-slate-700 rounded w-full" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  const userName = session?.user?.name ?? ''
  const unread = messages.filter((m) => !m.isRead).length

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">質問箱</h1>
        <p className="text-slate-400 text-sm mt-1">
          {userName ? `${userName}さんへの質問` : ''}
        </p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="bg-[#1e293b] border border-[#334155] rounded-xl p-5 animate-pulse">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-slate-700 rounded-full" />
                <div className="h-4 bg-slate-700 rounded w-32" />
              </div>
              <div className="h-3 bg-slate-700 rounded w-full" />
            </div>
          ))}
        </div>
      ) : messages.length === 0 ? (
        <div className="text-center py-16 bg-[#1e293b] rounded-xl border border-[#334155]">
          <div className="text-5xl mb-4">❓</div>
          <p className="text-slate-400 mb-2">質問はまだありません</p>
          <p className="text-slate-600 text-sm">ナレッジに質問ボタンが表示されます</p>
          <Link href="/" className="inline-block mt-4 text-cyan-400 hover:text-cyan-300 text-sm transition-colors">
            ナレッジ一覧へ →
          </Link>
        </div>
      ) : (
        <div>
          {unread > 0 && (
            <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-xl px-4 py-3 mb-4 flex items-center gap-2">
              <span className="w-5 h-5 bg-cyan-500 text-black text-xs font-bold rounded-full flex items-center justify-center">
                {unread}
              </span>
              <p className="text-cyan-400 text-sm">件の未読質問があります</p>
            </div>
          )}
          <div className="space-y-3">
            {messages.map((msg) => {
              const { postTitle, body } = parseQuestion(msg.content)
              return (
                <div
                  key={msg.id}
                  className={`border rounded-xl overflow-hidden transition-colors cursor-pointer ${
                    msg.isRead
                      ? 'bg-[#1e293b] border-[#334155] hover:border-slate-500'
                      : 'bg-[#1e2d45] border-cyan-500/30 hover:border-cyan-500/50'
                  }`}
                  onClick={() => toggleExpand(msg.id, msg.isRead)}
                >
                  <div className="p-4 flex items-start gap-3">
                    <div className="relative flex-shrink-0">
                      <div className="w-9 h-9 bg-gradient-to-br from-violet-500 to-violet-700 rounded-full flex items-center justify-center text-white font-bold">
                        {msg.fromName[0]?.toUpperCase()}
                      </div>
                      {!msg.isRead && (
                        <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-cyan-500 rounded-full border-2 border-[#1e2d45]" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/users/${encodeURIComponent(msg.fromName)}`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-white text-sm font-medium hover:text-violet-400 transition-colors"
                          >
                            {msg.fromName}
                          </Link>
                          {!msg.isRead && (
                            <span className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-xs px-1.5 py-0.5 rounded-full">
                              未読
                            </span>
                          )}
                        </div>
                        <span className="text-slate-600 text-xs flex-shrink-0">{formatDate(msg.createdAt)}</span>
                      </div>
                      {postTitle && (
                        <p className="text-xs text-slate-500 mb-1 truncate">📝 {postTitle}</p>
                      )}
                      <p
                        className={`text-sm ${expanded === msg.id ? 'text-slate-200 whitespace-pre-wrap' : 'text-slate-400 truncate'}`}
                      >
                        {body}
                      </p>
                    </div>
                    <span className="text-slate-600 text-xs flex-shrink-0 self-center">
                      {expanded === msg.id ? '▲' : '▼'}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
