'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import type { StructuredPost } from '@/lib/ai'

type Step = 'input' | 'processing' | 'review' | 'done'

export default function PostPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [step, setStep] = useState<Step>('input')
  const [rawInput, setRawInput] = useState('')
  const [structured, setStructured] = useState<StructuredPost | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (session === null) router.push('/auth/signin')
  }, [session, router])

  async function handleStructure() {
    if (!rawInput.trim() || !session?.user) return
    setStep('processing')
    try {
      const res = await fetch('/api/ai/structure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawInput }),
      })
      if (res.status === 429) {
        alert('リクエストが多すぎます。少し待ってから再試行してください。')
        setStep('input')
        return
      }
      const data: StructuredPost = await res.json()
      setStructured(data)
      setEditTitle(data.title)
      setEditContent(data.content)
      setStep('review')
    } catch {
      alert('AI処理に失敗しました')
      setStep('input')
    }
  }

  async function handleSave() {
    if (!structured) return
    setSaving(true)
    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawInput,
          title: editTitle,
          summary: structured.summary,
          content: editContent,
          tags: structured.tags,
          advice: structured.advice,
        }),
      })
      if (res.ok) {
        setStep('done')
        setTimeout(() => router.push('/'), 1500)
      } else {
        const data = await res.json()
        alert(data.error ?? '保存に失敗しました')
      }
    } catch {
      alert('保存に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  const stepLabels: { id: Step; label: string }[] = [
    { id: 'input', label: '① メモを入力' },
    { id: 'processing', label: '② AI整形' },
    { id: 'review', label: '③ 確認・保存' },
  ]

  if (!session) {
    return (
      <div className="p-8 max-w-3xl mx-auto text-center py-20">
        <div className="text-slate-500">読み込み中...</div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">ナレッジを投稿する</h1>
        <p className="text-slate-400 text-sm mt-1">メモや箇条書きをAIが技術記事に整形します</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-1.5 md:gap-2 mb-6 md:mb-8">
        {stepLabels.map((s, i) => {
          const isActive = step === s.id || (step === 'done' && i < 3)
          const isPast = (step === 'review' && i < 2) || step === 'done'
          return (
            <div key={s.id} className="flex items-center gap-1.5 md:gap-2">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors flex-shrink-0 ${
                  isActive || isPast ? 'bg-cyan-500 text-black' : 'bg-slate-700 text-slate-500'
                }`}
              >
                {i + 1}
              </div>
              <span className={`text-xs md:text-sm whitespace-nowrap ${isActive ? 'text-white' : 'text-slate-500'}`}>
                {s.label}
              </span>
              {i < 2 && <span className="text-slate-600 mx-0.5 md:mx-1">→</span>}
            </div>
          )
        })}
      </div>

      {/* Input */}
      {step === 'input' && (
        <div className="space-y-4">
          <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-xl px-4 py-3 flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-br from-violet-500 to-violet-700 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {session.user.name[0]?.toUpperCase()}
            </div>
            <p className="text-cyan-300 text-sm">
              <span className="font-medium">{session.user.name}</span> として投稿します
            </p>
          </div>
          <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-6">
            <label className="block text-sm text-slate-400 mb-2">
              今日学んだこと・解決したエラーを自由に書いてください
            </label>
            <textarea
              value={rawInput}
              onChange={(e) => setRawInput(e.target.value)}
              placeholder={`例:\n- Dockerのネットワーク設定でハマった\n- bridgeモードとhostモードの違いがわかった\n- docker-compose.yml の networks 設定で解決\n- depends_on だけじゃ通信できなかった`}
              className="w-full h-52 bg-[#0f172a] text-white text-sm rounded-lg p-4 outline-none border border-[#334155] focus:border-cyan-500/50 resize-none placeholder:text-slate-600"
              maxLength={5000}
            />
            <div className="flex justify-between items-center mt-4">
              <span className="text-xs text-slate-600">{rawInput.length} / 5000</span>
              <button
                onClick={handleStructure}
                disabled={!rawInput.trim()}
                className="bg-cyan-500 text-black px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-cyan-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                AIで構造化する ✨
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Processing */}
      {step === 'processing' && (
        <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-16 text-center">
          <div
            className="inline-block w-12 h-12 rounded-full border-t-cyan-500 border-cyan-500/20 animate-spin mb-6"
            style={{ borderWidth: '3px' }}
          />
          <p className="text-white font-medium">AIが整形中...</p>
          <p className="text-slate-500 text-sm mt-2">メモを技術記事に変換しています</p>
        </div>
      )}

      {/* Review */}
      {step === 'review' && structured && (
        <div className="space-y-4">
          <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-5">
            <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">タイトル</p>
            <input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              maxLength={200}
              className="w-full bg-transparent text-white font-semibold text-lg outline-none border-b border-transparent focus:border-cyan-500/50 pb-1"
            />
          </div>

          <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-5">
            <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">要約</p>
            <p className="text-slate-300 text-sm leading-relaxed">{structured.summary}</p>
          </div>

          <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-5">
            <p className="text-xs text-slate-500 uppercase tracking-wide mb-3">技術タグ</p>
            <div className="flex flex-wrap gap-2">
              {structured.tags.map((tag) => (
                <span
                  key={tag}
                  className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-sm px-3 py-1 rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-5">
            <p className="text-xs text-slate-500 uppercase tracking-wide mb-2">本文</p>
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              maxLength={50000}
              className="w-full h-52 bg-[#0f172a] text-slate-300 text-sm rounded-lg p-4 outline-none border border-[#334155] focus:border-cyan-500/50 resize-none"
            />
          </div>

          {structured.advice && (
            <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl p-4 flex items-start gap-2">
              <span className="text-violet-400 mt-0.5">💡</span>
              <div>
                <p className="text-violet-300 text-xs font-medium uppercase tracking-wide mb-1">AIアドバイス</p>
                <p className="text-violet-200 text-sm">{structured.advice}</p>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setStep('input')}
              className="flex-1 border border-[#334155] text-slate-400 px-6 py-2.5 rounded-lg text-sm hover:border-slate-500 hover:text-slate-200 transition-colors"
            >
              ← やり直す
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 bg-cyan-500 text-black px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-cyan-400 disabled:opacity-60 transition-colors"
            >
              {saving ? '保存中...' : '投稿する 🚀'}
            </button>
          </div>
        </div>
      )}

      {/* Done */}
      {step === 'done' && (
        <div className="bg-[#1e293b] border border-emerald-500/20 rounded-xl p-16 text-center">
          <div className="text-5xl mb-4">✅</div>
          <p className="text-white font-medium text-lg">投稿しました！</p>
          <p className="text-slate-500 text-sm mt-2">ダッシュボードに移動します...</p>
        </div>
      )}
    </div>
  )
}
