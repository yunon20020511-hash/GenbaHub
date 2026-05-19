'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import Link from 'next/link'

export default function SignUpPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (password.length < 8) {
      setError('パスワードは8文字以上で設定してください')
      return
    }
    setLoading(true)
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    })
    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? '登録に失敗しました')
      setLoading(false)
      return
    }
    const signInRes = await signIn('credentials', { email, password, redirect: false })
    setLoading(false)
    if (signInRes?.ok) {
      router.push('/')
      router.refresh()
    } else {
      router.push('/auth/signin')
    }
  }

  const inputCls =
    'w-full bg-[#0f172a] border border-[#334155] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-cyan-500/60 transition-colors'

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-xl flex items-center justify-center font-black text-black text-xl mx-auto mb-4 shadow-lg shadow-cyan-500/20">
            G
          </div>
          <h1 className="text-2xl font-bold text-white">Genba Hub</h1>
          <p className="text-slate-400 text-sm mt-1">現場エンジニアのナレッジ基地</p>
        </div>
        <div className="bg-[#1e293b] border border-[#334155] rounded-2xl p-6">
          <h2 className="text-white font-semibold text-lg mb-6">新規登録</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1.5">表示名</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                maxLength={50}
                className={inputCls}
                placeholder="現場名 / 氏名"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1.5">メールアドレス</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={inputCls}
                placeholder="your@email.com"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1.5">パスワード (8文字以上)</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className={inputCls}
                placeholder="••••••••"
              />
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-cyan-500 text-black py-3 rounded-xl text-sm font-semibold hover:bg-cyan-400 disabled:opacity-50 transition-colors"
            >
              {loading ? '登録中...' : '登録する'}
            </button>
          </form>
          <p className="text-center text-slate-500 text-sm mt-5">
            すでにアカウントをお持ちの方は{' '}
            <Link href="/auth/signin" className="text-cyan-400 hover:text-cyan-300 transition-colors">
              サインイン
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
