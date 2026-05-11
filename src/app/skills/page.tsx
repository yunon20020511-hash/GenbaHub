'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type SkillMap = Record<string, Record<string, { count: number; lastActive: string }>>

const COLORS = [
  'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  'bg-violet-500/10 text-violet-400 border-violet-500/20',
  'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  'bg-amber-500/10 text-amber-400 border-amber-500/20',
  'bg-rose-500/10 text-rose-400 border-rose-500/20',
]

const BORDER_SELECTED = [
  'ring-cyan-500/50',
  'ring-violet-500/50',
  'ring-emerald-500/50',
  'ring-amber-500/50',
  'ring-rose-500/50',
]

export default function SkillsPage() {
  const [skillMap, setSkillMap] = useState<SkillMap>({})
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [view, setView] = useState<'engineers' | 'skills'>('engineers')
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null)
  const [selectedSkillIndex, setSelectedSkillIndex] = useState(0)

  useEffect(() => {
    fetch('/api/skills')
      .then((r) => r.json())
      .then((data: SkillMap) => { setSkillMap(data); setLoading(false) })
  }, [])

  useEffect(() => { setSelectedSkill(null) }, [view])

  const engineers = Object.entries(skillMap)
    .filter(([name]) => !search || name.includes(search))
    .sort(([, a], [, b]) => Object.keys(b).length - Object.keys(a).length)

  const allSkillsMap: Record<string, { totalCount: number; engineers: number }> = {}
  const engineersWithSkill: Record<string, string[]> = {}
  for (const [name, skills] of Object.entries(skillMap)) {
    for (const [skill, data] of Object.entries(skills)) {
      if (!allSkillsMap[skill]) allSkillsMap[skill] = { totalCount: 0, engineers: 0 }
      allSkillsMap[skill].totalCount += data.count
      allSkillsMap[skill].engineers++
      if (!engineersWithSkill[skill]) engineersWithSkill[skill] = []
      engineersWithSkill[skill].push(name)
    }
  }
  const allSkills = Object.entries(allSkillsMap)
    .filter(([name]) => !search || name.includes(search))
    .sort(([, a], [, b]) => b.totalCount - a.totalCount)

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">エンジニア検索</h1>
        <p className="text-slate-400 text-sm mt-1">チームのスキル分布・エンジニアを検索</p>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="エンジニア名またはスキルで検索..."
          className="flex-1 min-w-0 bg-[#1e293b] text-white text-sm rounded-xl px-4 py-2.5 outline-none border border-[#334155] focus:border-cyan-500/50 placeholder:text-slate-600"
        />
        <div className="flex bg-[#1e293b] border border-[#334155] rounded-xl overflow-hidden flex-shrink-0">
          {(['engineers', 'skills'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 md:px-4 py-2 text-sm transition-colors ${
                view === v ? 'bg-cyan-500/10 text-cyan-400' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {v === 'engineers' ? '👥 エンジニア別' : '⚡ スキル別'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-[#1e293b] border border-[#334155] rounded-xl p-5 animate-pulse">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-slate-700 rounded-full" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-slate-700 rounded w-1/3" />
                  <div className="h-3 bg-slate-700 rounded w-1/4" />
                </div>
              </div>
              <div className="flex gap-2">
                <div className="h-6 bg-slate-700 rounded-full w-16" />
                <div className="h-6 bg-slate-700 rounded-full w-20" />
                <div className="h-6 bg-slate-700 rounded-full w-14" />
              </div>
            </div>
          ))}
        </div>
      ) : view === 'engineers' ? (
        engineers.length === 0 ? (
          <div className="text-center py-16 text-slate-500">データがありません</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {engineers.map(([name, skills]) => {
              const sorted = Object.entries(skills).sort(([, a], [, b]) => b.count - a.count)
              const totalPosts = sorted.reduce((s, [, v]) => s + v.count, 0)
              return (
                <div
                  key={name}
                  className="bg-[#1e293b] border border-[#334155] rounded-xl p-5 hover:border-cyan-500/40 transition-colors"
                >
                  <div className="flex items-center justify-between mb-4">
                    <Link
                      href={`/users/${encodeURIComponent(name)}`}
                      className="flex items-center gap-3 group"
                    >
                      <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-violet-700 rounded-full flex items-center justify-center text-white font-bold group-hover:from-violet-400 transition-all">
                        {name[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="text-white font-medium group-hover:text-cyan-400 transition-colors">{name}</p>
                        <p className="text-slate-500 text-xs">{sorted.length}スキル・{totalPosts}投稿</p>
                      </div>
                    </Link>
                    <Link
                      href={`/users/${encodeURIComponent(name)}`}
                      className="text-xs text-slate-500 hover:text-cyan-400 border border-[#334155] hover:border-cyan-500/40 px-2.5 py-1 rounded-lg transition-colors"
                    >
                      詳細 →
                    </Link>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {sorted.map(([skill, data], i) => (
                      <span
                        key={skill}
                        className={`inline-flex items-center gap-1 border text-xs px-2.5 py-0.5 rounded-full ${COLORS[i % COLORS.length]}`}
                      >
                        {skill}
                        <span className="opacity-60">{data.count}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )
      ) : (
        <>
        <div className="flex gap-5 items-start">
          <div className={`grid gap-3 transition-all duration-300 ${selectedSkill ? 'grid-cols-2 flex-1' : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 flex-1'}`}>
            {allSkills.map(([skill, data], i) => {
              const isSelected = selectedSkill === skill
              return (
                <button
                  key={skill}
                  onClick={() => {
                    setSelectedSkill(isSelected ? null : skill)
                    setSelectedSkillIndex(i)
                  }}
                  className={`text-left border rounded-xl p-4 transition-all duration-200 ${COLORS[i % COLORS.length]} ${
                    isSelected
                      ? `ring-2 ${BORDER_SELECTED[i % BORDER_SELECTED.length]} scale-[1.02] shadow-lg`
                      : 'hover:opacity-90 hover:scale-[1.01]'
                  }`}
                >
                  <p className="font-semibold text-sm mb-2 truncate">{skill}</p>
                  <p className="text-3xl font-black mb-1">{data.totalCount}</p>
                  <div className="flex items-center justify-between">
                    <p className="text-xs opacity-60">{data.engineers}人が保有</p>
                    <span className="text-xs opacity-50">{isSelected ? '◀' : '▶'}</span>
                  </div>
                </button>
              )
            })}
          </div>

          {selectedSkill && (
            <div className="hidden md:block w-72 flex-shrink-0 sticky top-4">
              <div className={`bg-[#1e293b] border rounded-xl overflow-hidden shadow-xl ${COLORS[selectedSkillIndex % COLORS.length].split(' ')[2]}`}
                style={{ borderColor: 'transparent' }}
              >
                <div className="px-4 py-3 border-b border-[#334155] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${COLORS[selectedSkillIndex % COLORS.length]}`}>
                      {selectedSkill}
                    </span>
                    <span className="text-slate-500 text-xs">保有エンジニア</span>
                  </div>
                  <button
                    onClick={() => setSelectedSkill(null)}
                    className="text-slate-500 hover:text-white w-6 h-6 flex items-center justify-center rounded-lg hover:bg-slate-700 transition-colors text-xs"
                  >
                    ✕
                  </button>
                </div>

                <div className="p-3 space-y-2">
                  {(engineersWithSkill[selectedSkill] ?? []).map((name) => (
                    <Link
                      key={name}
                      href={`/users/${encodeURIComponent(name)}`}
                      className="flex items-center gap-2 bg-[#0f172a] border border-[#334155] rounded-xl px-3 py-2.5 hover:border-cyan-500/30 transition-colors group"
                    >
                      <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-violet-700 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                        {name[0]?.toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-white text-sm font-medium truncate group-hover:text-cyan-400 transition-colors">
                          {name}
                        </p>
                        <p className="text-slate-500 text-xs">
                          {selectedSkill}の投稿 {skillMap[name]?.[selectedSkill]?.count ?? 0}件
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>

                <div className="px-4 pb-4">
                  <p className="text-xs text-slate-600 text-center">
                    クリックでプロフィールへ
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Mobile: selected skill engineer list (shown below grid) */}
        {selectedSkill && (
          <div className="md:hidden mt-4 bg-[#1e293b] border border-[#334155] rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-[#334155] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${COLORS[selectedSkillIndex % COLORS.length]}`}>
                  {selectedSkill}
                </span>
                <span className="text-slate-500 text-xs">保有エンジニア</span>
              </div>
              <button
                onClick={() => setSelectedSkill(null)}
                className="text-slate-500 hover:text-white w-6 h-6 flex items-center justify-center rounded-lg hover:bg-slate-700 transition-colors text-xs"
              >
                ✕
              </button>
            </div>
            <div className="p-3 space-y-2">
              {(engineersWithSkill[selectedSkill] ?? []).map((name) => (
                <Link
                  key={name}
                  href={`/users/${encodeURIComponent(name)}`}
                  className="flex items-center gap-2 bg-[#0f172a] border border-[#334155] rounded-xl px-3 py-2.5 hover:border-cyan-500/30 transition-colors group"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-violet-700 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    {name[0]?.toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-white text-sm font-medium truncate group-hover:text-cyan-400 transition-colors">
                      {name}
                    </p>
                    <p className="text-slate-500 text-xs">
                      {selectedSkill}の投稿 {skillMap[name]?.[selectedSkill]?.count ?? 0}件
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
        </>
      )}
    </div>
  )
}
