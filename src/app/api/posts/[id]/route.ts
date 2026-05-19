import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const post = await prisma.post.findUnique({ where: { id }, select: POST_SELECT })
    if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(post)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch post' }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    const existing = await prisma.post.findUnique({
      where: { id },
      select: { authorId: true },
    })
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (existing.authorId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { title, content, summary } = body

    if (title !== undefined) {
      if (typeof title !== 'string' || !title.trim()) {
        return NextResponse.json({ error: 'タイトルが無効です' }, { status: 400 })
      }
      if (title.length > 200) {
        return NextResponse.json({ error: 'タイトルは200文字以内で入力してください' }, { status: 400 })
      }
    }
    if (content !== undefined && content.length > 50000) {
      return NextResponse.json({ error: '本文は50000文字以内で入力してください' }, { status: 400 })
    }

    const post = await prisma.post.update({
      where: { id },
      data: {
        ...(title !== undefined && { title: title.trim() }),
        ...(content !== undefined && { content }),
        ...(summary !== undefined && { summary }),
      },
      select: POST_SELECT,
    })
    return NextResponse.json(post)
  } catch {
    return NextResponse.json({ error: 'Failed to update post' }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    const existing = await prisma.post.findUnique({
      where: { id },
      select: { authorId: true },
    })
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (existing.authorId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await prisma.post.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 })
  }
}
