import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const author = request.nextUrl.searchParams.get('author')
  try {
    const posts = await prisma.post.findMany({
      where: author ? { authorName: author } : undefined,
      orderBy: { createdAt: 'desc' },
      take: 100,
    })
    return NextResponse.json(posts)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { authorName, rawInput, title, summary, content, tags, advice } = body

    if (!authorName || !title || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const post = await prisma.post.create({
      data: {
        authorName,
        rawInput: rawInput ?? '',
        title,
        summary: summary ?? '',
        content,
        tags: JSON.stringify(Array.isArray(tags) ? tags : []),
        advice: advice ?? null,
      },
    })
    return NextResponse.json(post)
  } catch {
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 })
  }
}
