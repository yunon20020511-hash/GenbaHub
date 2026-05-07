import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const post = await prisma.post.update({
      where: { id: params.id },
      data: { likes: { increment: 1 } },
      select: { likes: true },
    })
    return NextResponse.json({ likes: post.likes })
  } catch {
    return NextResponse.json({ error: 'Failed to like post' }, { status: 500 })
  }
}
