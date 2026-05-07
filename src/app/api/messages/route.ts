import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const to = request.nextUrl.searchParams.get('to')
  if (!to) return NextResponse.json([])

  try {
    const messages = await prisma.message.findMany({
      where: { toName: to },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(messages)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { fromName, toName, content } = await request.json()
    if (!fromName || !toName || !content?.trim()) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }
    const message = await prisma.message.create({
      data: { fromName, toName, content },
    })
    return NextResponse.json(message)
  } catch {
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const { id } = await request.json()
    await prisma.message.update({ where: { id }, data: { isRead: true } })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Failed to update message' }, { status: 500 })
  }
}
