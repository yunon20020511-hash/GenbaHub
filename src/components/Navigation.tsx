'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

const navItems = [
  { href: '/', label: 'ナレッジ一覧', icon: '⚡' },
  { href: '/post', label: '知恵を投稿', icon: '✏️' },
  { href: '/skills', label: 'エンジニア検索', icon: '👥' },
  { href: '/search', label: '現場あるある Bot', icon: '🔍' },
  { href: '/messages', label: '質問箱', icon: '❓', badge: true },
]

export default function Navigation() {
  const pathname = usePathname()
  const [userName, setUserName] = useState('')
  const [editing, setEditing] = useState(false)
  const [input, setInput] = useState('')
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    const stored = localStorage.getItem('pk_username')
    if (stored) setUserName(stored)
  }, [])

  useEffect(() => {
    if (!userName) return
    fetch(`/api/messages?to=${encodeURIComponent(userName)}`)
      .then((r) => r.json())
      .then((msgs: { isRead: boolean }[]) => {
        if (Array.isArray(msgs)) {
          setUnreadCount(msgs.filter((m) => !m.isRead).length)
        }
      })
      .catch(() => {})
  }, [userName, pathname])

  function saveName() {
    const name = input.trim()
    if (name) {
      localStorage.setItem('pk_username', name)
      setUserName(name)
    }
    setEditing(false)
  }

  return (
    <aside className="w-60 flex-shrink-0 bg-[#0d1525] border-r border-[#1e2d45] flex flex-col">
      {/* Logo */}
      <div className="p-5 border-b border-[#1e2d45]">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-xl flex items-center justify-center font-black text-black text-base shadow-lg shadow-cyan-500/20">
            G
          </div>
          <div>
            <span className="font-bold text-white text-lg tracking-tight">Genba Hub</span>
            <p className="text-slate-500 text-xs">現場エンジニアのナレッジ基地</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                isActive
                  ? 'bg-cyan-500/10 text-cyan-400 font-medium shadow-sm'
                  : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
              }`}
            >
              <span className="text-base leading-none">{item.icon}</span>
              <span className="flex-1">{item.label}</span>
              {item.badge && unreadCount > 0 && (
                <span className="bg-rose-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center leading-none">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Divider */}
      <div className="mx-4 border-t border-[#1e2d45]" />

      {/* User */}
      <div className="p-3">
        {editing ? (
          <div className="flex gap-2 p-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && saveName()}
              placeholder="現場名 / 氏名"
              autoFocus
              className="flex-1 bg-[#1e293b] text-white text-xs rounded-lg px-3 py-2 outline-none border border-cyan-500/50"
            />
            <button
              onClick={saveName}
              className="text-cyan-400 hover:text-cyan-300 text-sm px-1 transition-colors"
            >
              ✓
            </button>
          </div>
        ) : (
          <button
            onClick={() => { setInput(userName); setEditing(true) }}
            className="flex items-center gap-2.5 w-full text-left hover:bg-white/5 rounded-xl p-2.5 transition-colors group"
          >
            <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-violet-700 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-md">
              {userName ? userName[0].toUpperCase() : '?'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-white text-xs font-medium truncate group-hover:text-cyan-400 transition-colors">
                {userName || '名前を設定してください'}
              </p>
              <p className="text-slate-600 text-xs">タップして編集</p>
            </div>
          </button>
        )}
      </div>
    </aside>
  )
}
