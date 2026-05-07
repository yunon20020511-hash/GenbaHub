import { NextResponse } from 'next/server'
import { structureKnowledge } from '@/lib/ai'

export async function POST(request: Request) {
  try {
    const { rawInput, authorName } = await request.json()
    if (!rawInput?.trim()) {
      return NextResponse.json({ error: 'Input is required' }, { status: 400 })
    }
    const structured = await structureKnowledge(rawInput, authorName ?? 'エンジニア')
    return NextResponse.json(structured)
  } catch {
    return NextResponse.json({ error: 'AI processing failed' }, { status: 500 })
  }
}
