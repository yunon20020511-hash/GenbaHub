'use client'

import { useEffect, useState } from 'react'

interface Props {
  toName: string
  onClose: () => void
}

export default function DMModal({ toName, onClose }: Props) {
  const [fromName, setFromName] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('pk_username')
    if (stored) setFromName(stored)
  }, [])

  async function handleSend() {
    if (!message.trim() || !fromName.trim()) return
    setSending(true)
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fromName, toName, content: message }),
      })
      if (res.ok) setSent(true)
    } finally {
      setSending(false)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-[#1e293b] border border-[#334155] rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-[#334155]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-violet-600 rounded-full flex items-center justify-center text-white font-bold">
              {toName[0]?.toUpperCase()}
            </div>
            <div>
              <p className="text-white font-semibold text-sm">DMを送る</p>
              <p className="text-slate-500 text-xs">宛先: {toName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-white transition-colors w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-700"
          >
            ✕
          </button>
        </div>

        {sent ? (
          <div className="p-10 text-center">
            <div className="text-5xl mb-4">✅</div>
            <p className="text-white font-semibold text-lg">送信しました！</p>
            <p className="text-slate-400 text-sm mt-1">{toName}さんに届きました</p>
            <button
              onClick={onClose}
              className="mt-5 text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              閉じる
            </button>
          </div>
        ) : (
          <div className="p-5">
            {!fromName && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 mb-4 flex items-center gap-2">
                <span className="text-amber-400">⚠</span>
                <p className="text-amber-300 text-xs">左サイドバーで自分の名前を設定してください</p>
              </div>
            )}
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={`${toName}さんへのメッセージを入力...\n（スキルについての質問、案件の相談など）`}
              className="w-full h-36 bg-[#0f172a] text-white text-sm rounded-xl p-4 outline-none border border-[#334155] focus:border-cyan-500/50 resize-none placeholder:text-slate-600"
              autoFocus
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={onClose}
                className="flex-1 border border-[#334155] text-slate-400 py-2.5 rounded-xl text-sm hover:border-slate-500 hover:text-slate-200 transition-colors"
              >
                キャンセル
              </button>
              <button
                onClick={handleSend}
                disabled={!message.trim() || !fromName || sending}
                className="flex-1 bg-cyan-500 text-black py-2.5 rounded-xl text-sm font-semibold hover:bg-cyan-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {sending ? '送信中...' : '送信する 💬'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
