import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q') ?? ''
  if (!q.trim()) return NextResponse.json([])

  const safeQ = q.slice(0, 200)

  try {
    const posts = await prisma.post.findMany({
      where: {
        OR: [
          { title: { contains: safeQ, mode: 'insensitive' } },
          { summary: { contains: safeQ, mode: 'insensitive' } },
          { content: { contains: safeQ, mode: 'insensitive' } },
          { tags: { contains: safeQ, mode: 'insensitive' } },
          { authorName: { contains: safeQ, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        authorName: true,
        title: true,
        summary: true,
        content: true,
        tags: true,
        advice: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    })
    return NextResponse.json(posts)
  } catch {
    return NextResponse.json({ error: 'Search failed' }, { status: 500 })
  }
}
