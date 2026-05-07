import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const posts = await prisma.post.findMany({
      select: { authorName: true, tags: true, createdAt: true },
    })

    const skillMap: Record<string, Record<string, { count: number; lastActive: string }>> = {}

    for (const post of posts) {
      const author = post.authorName
      let tags: string[] = []
      try { tags = JSON.parse(post.tags) } catch { continue }

      if (!skillMap[author]) skillMap[author] = {}

      for (const tag of tags) {
        if (!tag) continue
        if (!skillMap[author][tag]) {
          skillMap[author][tag] = { count: 0, lastActive: post.createdAt.toISOString() }
        }
        skillMap[author][tag].count++
        if (post.createdAt.toISOString() > skillMap[author][tag].lastActive) {
          skillMap[author][tag].lastActive = post.createdAt.toISOString()
        }
      }
    }

    return NextResponse.json(skillMap)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch skills' }, { status: 500 })
  }
}
