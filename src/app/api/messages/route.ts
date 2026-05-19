import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { rateLimit } from '@/lib/rateLimit'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const messages = await prisma.message.findMany({
      where: { toId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })
    return NextResponse.json(messages)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!rateLimit(`message:${session.user.id}`, 30, 60 * 60_000)) {
    return NextResponse.json(
      { error: 'メッセージ送信が多すぎます。1時間後に再試行してください。' },
      { status: 429 }
    )
  }

  try {
    const { toName, content } = await request.json()
    if (!toName?.trim() || !content?.trim()) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }
    if (content.length > 2000) {
      return NextResponse.json({ error: 'メッセージは2000文字以内で入力してください' }, { status: 400 })
    }

    const recipient = await prisma.user.findUnique({ where: { name: toName } })
    if (!recipient) {
      return NextResponse.json({ error: 'Recipient not found' }, { status: 404 })
    }

    const message = await prisma.message.create({
      data: {
        fromId: session.user.id,
        fromName: session.user.name,
        toId: recipient.id,
        toName: recipient.name,
        content: content.trim(),
      },
    })
    return NextResponse.json(message)
  } catch {
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await request.json()
    const message = await prisma.message.findUnique({
      where: { id },
      select: { toId: true },
    })
    if (!message || message.toId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    await prisma.message.update({ where: { id }, data: { isRead: true } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Failed to update message' }, { status: 500 })
  }
}
