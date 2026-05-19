'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useSession, signOut } from 'next-auth/react'

const navItems = [
  { href: '/', label: 'ナレッジ一覧', icon: '⚡' },
  { href: '/post', label: '知恵を投稿', icon: '✏️' },
  { href: '/skills', label: 'エンジニア検索', icon: '👥' },
  { href: '/search', label: '現場あるある Bot', icon: '🔍' },
  { href: '/messages', label: '質問箱', icon: '💬' },
]

export default function Navigation() {
  const pathname = usePathname()
  const router = useRouter()
  const { data: session, status } = useSession()
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  const userName = session?.user?.name ?? ''

  async function handleSignOut() {
    await signOut({ redirect: false })
    router.push('/auth/signin')
    router.refresh()
  }

  return (
    <>
      {/* Mobile hamburger */}
      <button
        onClick={() => setIsOpen(true)}
        className="md:hidden fixed top-3 left-3 z-50 w-10 h-10 bg-[#1e293b] border border-[#334155] rounded-xl flex items-center justify-center text-slate-300 hover:text-white"
        aria-label="メニューを開く"
      >
        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="2" y1="5" x2="16" y2="5" />
          <line x1="2" y1="9" x2="16" y2="9" />
          <line x1="2" y1="13" x2="16" y2="13" />
        </svg>
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/60 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          w-60 flex-shrink-0 bg-[#0d1525] border-r border-[#1e2d45] flex flex-col
          fixed md:static top-0 left-0 h-full z-50
          transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        {/* Logo */}
        <div className="p-5 border-b border-[#1e2d45] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-xl flex items-center justify-center font-black text-black text-base shadow-lg shadow-cyan-500/20">
              G
            </div>
            <div>
              <span className="font-bold text-white text-lg tracking-tight">Genba Hub</span>
              <p className="text-slate-500 text-xs">現場エンジニアのナレッジ基地</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="md:hidden text-slate-500 hover:text-slate-300 p-1"
            aria-label="メニューを閉じる"
          >
            ✕
          </button>
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
              </Link>
            )
          })}
        </nav>

        <div className="mx-4 border-t border-[#1e2d45]" />

        {/* User */}
        <div className="p-3">
          {status === 'loading' ? (
            <div className="flex items-center gap-2.5 p-2.5">
              <div className="w-8 h-8 bg-slate-700 rounded-full animate-pulse" />
              <div className="h-3 bg-slate-700 rounded w-24 animate-pulse" />
            </div>
          ) : session ? (
            <div className="space-y-1">
              <Link
                href={`/users/${encodeURIComponent(userName)}`}
                className="flex items-center gap-2.5 w-full text-left hover:bg-white/5 rounded-xl p-2.5 transition-colors group"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-violet-700 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-md">
                  {userName[0]?.toUpperCase() ?? '?'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-white text-xs font-medium truncate group-hover:text-cyan-400 transition-colors">
                    {userName}
                  </p>
                  <p className="text-slate-600 text-xs truncate">{session.user.email}</p>
                </div>
              </Link>
              <button
                onClick={handleSignOut}
                className="w-full text-left flex items-center gap-2.5 px-2.5 py-2 text-slate-500 hover:text-red-400 hover:bg-red-500/5 rounded-xl text-xs transition-colors"
              >
                <span>↩</span>
                <span>サインアウト</span>
              </button>
            </div>
          ) : (
            <Link
              href="/auth/signin"
              className="flex items-center gap-2.5 w-full px-2.5 py-2.5 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 rounded-xl text-cyan-400 text-xs font-medium transition-colors"
            >
              <span>→</span>
              <span>サインイン / 登録</span>
            </Link>
          )}
        </div>
      </aside>
    </>
  )
}
