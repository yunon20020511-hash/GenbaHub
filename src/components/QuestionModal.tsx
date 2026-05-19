'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'

interface Props {
  toName: string
  postTitle: string
  onClose: () => void
}

export default function QuestionModal({ toName, postTitle, onClose }: Props) {
  const { data: session } = useSession()
  const [question, setQuestion] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSend() {
    if (!question.trim() || !session?.user) return
    setSending(true)
    await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        toName,
        content: `【質問】${postTitle}\n\n${question.trim()}`,
      }),
    })
    setSending(false)
    setSent(true)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative bg-[#1e293b] border border-[#334155] rounded-2xl shadow-2xl w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {sent ? (
          <div className="text-center py-4">
            <div className="text-4xl mb-3">✅</div>
            <p className="text-white font-semibold mb-1">質問を送りました</p>
            <p className="text-slate-400 text-sm mb-4">{toName}さんに届きます</p>
            <button
              onClick={onClose}
              className="bg-cyan-500 text-black px-6 py-2 rounded-xl text-sm font-semibold hover:bg-cyan-400 transition-colors"
            >
              閉じる
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-white font-semibold text-base">❓ 質問を送る</h3>
                <p className="text-slate-500 text-xs mt-0.5">宛先: {toName}</p>
              </div>
              <button
                onClick={onClose}
                className="text-slate-500 hover:text-white w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-700 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="bg-[#0f172a] border border-[#334155] rounded-xl px-4 py-3 mb-4">
              <p className="text-xs text-slate-500 mb-1">この投稿について質問する</p>
              <p className="text-slate-300 text-sm line-clamp-2">{postTitle}</p>
            </div>

            {!session && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl px-3 py-2 mb-3">
                <p className="text-amber-400 text-xs">サインインしてから質問してください</p>
              </div>
            )}

            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="質問を入力してください..."
              maxLength={2000}
              rows={4}
              className="w-full bg-[#0f172a] border border-[#334155] rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500/60 resize-none mb-4"
            />

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 text-slate-400 border border-[#334155] py-2.5 rounded-xl text-sm hover:border-slate-500 transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={handleSend}
                disabled={!question.trim() || !session || sending}
                className="flex-1 bg-cyan-500 text-black py-2.5 rounded-xl text-sm font-semibold hover:bg-cyan-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {sending ? '送信中...' : '送信する'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
