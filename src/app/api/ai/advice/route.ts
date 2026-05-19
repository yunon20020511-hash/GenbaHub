import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'
import { prisma } from '@/lib/prisma'
import { rateLimit } from '@/lib/rateLimit'

interface RelatedPost {
  id: string
  title: string
  summary: string
  authorName: string
  tags: string[]
}

async function findRelatedPosts(query: string): Promise<RelatedPost[]> {
  const keywords = query
    .split(/[\s　、。,]+/)
    .map((k) => k.trim())
    .filter((k) => k.length >= 2)
    .slice(0, 5)

  if (keywords.length === 0) return []

  try {
    const posts = await prisma.post.findMany({
      where: {
        OR: keywords.flatMap((k) => [
          { tags: { contains: k, mode: 'insensitive' } },
          { title: { contains: k, mode: 'insensitive' } },
          { summary: { contains: k, mode: 'insensitive' } },
        ]),
      },
      select: { id: true, title: true, summary: true, authorName: true, tags: true },
      orderBy: { likes: 'desc' },
      take: 3,
    })

    return posts.map((p) => ({
      id: p.id,
      title: p.title,
      summary: p.summary,
      authorName: p.authorName,
      tags: (() => { try { return JSON.parse(p.tags) as string[] } catch { return [] } })(),
    }))
  } catch {
    return []
  }
}

const fallback = (query: string, relatedPosts: RelatedPost[]) => ({
  advice: `「${query}」に関するナレッジはまだ登録されていません。公式ドキュメントや Stack Overflow を参照し、解決できたらぜひ Genba Hub に投稿してチームで共有しましょう！`,
  relatedSkills: [] as string[],
  steps: ['公式ドキュメントを確認する', 'Stack Overflow / Qiita で検索する', '解決したら Genba Hub に投稿する'],
  relatedPosts,
})

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown'
  if (!rateLimit(`advice:${ip}`, 20, 60_000)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  try {
    const { query } = await request.json()
    if (!query?.trim()) return NextResponse.json(fallback('', []))
    const safeQuery = String(query).slice(0, 200)

    const relatedPosts = await findRelatedPosts(safeQuery)

    const apiKey = process.env.GROQ_API_KEY
    if (!apiKey) return NextResponse.json(fallback(safeQuery, relatedPosts))

    const groq = new Groq({ apiKey })

    const knowledgeContext =
      relatedPosts.length > 0
        ? `\n\n参考になりそうな社内ナレッジ:\n` +
          relatedPosts.map((p) => `- ${p.title}（タグ: ${p.tags.join(', ')}）`).join('\n')
        : ''

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      temperature: 0.5,
      max_tokens: 1024,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `あなたはSESエンジニアを支援するテクニカルアドバイザーです。以下のJSON形式のみで回答してください:
{"advice":"具体的なアドバイス（150文字以内）","relatedSkills":["技術1","技術2"],"steps":["アプローチ1","アプローチ2"]}`,
        },
        {
          role: 'user',
          content: safeQuery + knowledgeContext,
        },
      ],
    })

    const text = completion.choices[0].message.content ?? '{}'
    const parsed = JSON.parse(text)
    return NextResponse.json({
      advice: typeof parsed.advice === 'string' ? parsed.advice.slice(0, 300) : '',
      relatedSkills: Array.isArray(parsed.relatedSkills)
        ? parsed.relatedSkills.slice(0, 5).map(String)
        : [],
      steps: Array.isArray(parsed.steps)
        ? parsed.steps.slice(0, 5).map(String)
        : [],
      relatedPosts,
    })
  } catch {
    return NextResponse.json(fallback('', []))
  }
}
