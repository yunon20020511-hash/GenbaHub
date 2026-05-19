'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4">
      <div className="bg-[#1e293b] border border-red-500/20 rounded-2xl p-8 max-w-md w-full text-center">
        <div className="w-12 h-12 bg-red-500/10 rounded-xl flex items-center justify-center mx-auto mb-4">
          <span className="text-red-400 text-2xl">!</span>
        </div>
        <h2 className="text-white font-bold text-lg mb-2">エラーが発生しました</h2>
        <p className="text-slate-400 text-sm mb-6">
          {error.digest ? `エラーコード: ${error.digest}` : '予期しないエラーが発生しました。しばらく経ってから再試行してください。'}
        </p>
        <button
          onClick={reset}
          className="bg-cyan-500 text-black px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-cyan-400 transition-colors"
        >
          再試行
        </button>
      </div>
    </div>
  )
}
