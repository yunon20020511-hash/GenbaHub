import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { structureKnowledge } from '@/lib/ai'
import { rateLimit } from '@/lib/rateLimit'

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!rateLimit(`structure:${session.user.id}`, 10, 60_000)) {
    return NextResponse.json(
      { error: 'リクエストが多すぎます。1分後に再試行してください。' },
      { status: 429 }
    )
  }

  try {
    const { rawInput } = await request.json()
    if (!rawInput?.trim()) {
      return NextResponse.json({ error: 'Input is required' }, { status: 400 })
    }
    if (rawInput.length > 5000) {
      return NextResponse.json(
        { error: '入力は5000文字以内で入力してください' },
        { status: 400 }
      )
    }
    const structured = await structureKnowledge(rawInput, session.user.name)
    return NextResponse.json(structured)
  } catch {
    return NextResponse.json({ error: 'AI processing failed' }, { status: 500 })
  }
}
