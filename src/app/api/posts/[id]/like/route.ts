import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    const existing = await prisma.like.findUnique({
      where: { userId_postId: { userId: session.user.id, postId: id } },
    })
    if (existing) {
      return NextResponse.json({ error: 'Already liked' }, { status: 409 })
    }

    const [, post] = await prisma.$transaction([
      prisma.like.create({ data: { userId: session.user.id, postId: id } }),
      prisma.post.update({
        where: { id },
        data: { likes: { increment: 1 } },
        select: { likes: true },
      }),
    ])

    return NextResponse.json({ likes: post.likes })
  } catch {
    return NextResponse.json({ error: 'Failed to like post' }, { status: 500 })
  }
}
