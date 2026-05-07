import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q') ?? ''
  if (!q.trim()) return NextResponse.json([])

  try {
    const posts = await prisma.post.findMany({
      where: {
        OR: [
          { title: { contains: q } },
          { summary: { contains: q } },
          { content: { contains: q } },
          { tags: { contains: q } },
          { authorName: { contains: q } },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    })
    return NextResponse.json(posts)
  } catch {
    return NextResponse.json({ error: 'Search failed' }, { status: 500 })
  }
}
