import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { rateLimit } from '@/lib/rateLimit'

const POST_SELECT = {
  id: true,
  authorName: true,
  title: true,
  summary: true,
  content: true,
  tags: true,
  advice: true,
  likes: true,
  createdAt: true,
}

export async function GET(request: NextRequest) {
  const author = request.nextUrl.searchParams.get('author')
  try {
    const cursor = request.nextUrl.searchParams.get('cursor') ?? undefined
    const limit = Math.min(parseInt(request.nextUrl.searchParams.get('limit') ?? '50'), 100)
    const posts = await prisma.post.findMany({
      select: POST_SELECT,
      where: author ? { authorName: author } : undefined,
      orderBy: { createdAt: 'desc' },
      take: limit,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    })
    return NextResponse.json(posts)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!rateLimit(`post:create:${session.user.id}`, 20, 60 * 60_000)) {
    return NextResponse.json(
      { error: '投稿が多すぎます。1時間後に再試行してください。' },
      { status: 429 }
    )
  }

  try {
    const body = await request.json()
    const { rawInput, title, summary, content, tags, advice } = body

    if (!title?.trim() || !content?.trim()) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    if (title.length > 200) {
      return NextResponse.json({ error: 'タイトルは200文字以内で入力してください' }, { status: 400 })
    }
    if (content.length > 50000) {
      return NextResponse.json({ error: '本文は50000文字以内で入力してください' }, { status: 400 })
    }
    if (rawInput && rawInput.length > 10000) {
      return NextResponse.json({ error: 'メモは10000文字以内で入力してください' }, { status: 400 })
    }

    const post = await prisma.post.create({
      select: POST_SELECT,
      data: {
        authorId: session.user.id,
        authorName: session.user.name,
        rawInput: rawInput ?? '',
        title: title.trim(),
        summary: summary ?? '',
        content,
        tags: JSON.stringify(Array.isArray(tags) ? tags.slice(0, 10) : []),
        advice: advice ?? null,
      },
    })
    return NextResponse.json(post)
  } catch {
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 })
  }
}
