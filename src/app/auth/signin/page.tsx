'use client'

import { signIn } from 'next-auth/react'
import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

function SignInForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const raw = searchParams.get('callbackUrl') ?? '/'
  const callbackUrl = /^\/(?!\/)[\w\-/?=&#%]*$/.test(raw) ? raw : '/'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const res = await signIn('credentials', { email, password, redirect: false })
    setLoading(false)
    if (res?.error) {
      setError('メールアドレスまたはパスワードが正しくありません')
    } else {
      router.push(callbackUrl)
      router.refresh()
    }
  }

  const inputCls =
    'w-full bg-[#0f172a] border border-[#334155] rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-cyan-500/60 transition-colors'

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
        <label className="block text-sm text-slate-400 mb-1.5">パスワード</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
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
        {loading ? 'サインイン中...' : 'サインイン'}
      </button>
    </form>
  )
}

export default function SignInPage() {
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
          <h2 className="text-white font-semibold text-lg mb-6">サインイン</h2>
          <Suspense fallback={<div className="text-slate-500 text-sm text-center py-4">読み込み中...</div>}>
            <SignInForm />
          </Suspense>
          <p className="text-center text-slate-500 text-sm mt-5">
            アカウントをお持ちでない方は{' '}
            <Link href="/auth/signup" className="text-cyan-400 hover:text-cyan-300 transition-colors">
              新規登録
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
