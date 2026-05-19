import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { rateLimit } from '@/lib/rateLimit'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const NAME_RE = /^[\w぀-ゟ゠-ヿ一-鿿\s\-]+$/

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown'
  if (!rateLimit(`register:${ip}`, 10, 60 * 60_000)) {
    return NextResponse.json(
      { error: '登録の試行回数が多すぎます。1時間後に再試行してください。' },
      { status: 429 }
    )
  }

  try {
    const { name, email, password } = await request.json()

    if (!name?.trim() || !email?.trim() || !password) {
      return NextResponse.json({ error: '必須項目が不足しています' }, { status: 400 })
    }
    if (name.trim().length > 50) {
      return NextResponse.json({ error: '名前は50文字以内で入力してください' }, { status: 400 })
    }
    if (!NAME_RE.test(name.trim())) {
      return NextResponse.json({ error: '名前に使用できない文字が含まれています' }, { status: 400 })
    }
    if (!EMAIL_RE.test(email)) {
      return NextResponse.json({ error: 'メールアドレスの形式が正しくありません' }, { status: 400 })
    }
    if (password.length < 8) {
      return NextResponse.json({ error: 'パスワードは8文字以上で設定してください' }, { status: 400 })
    }

    const existing = await prisma.user.findFirst({
      where: { OR: [{ email: email.toLowerCase() }, { name: name.trim() }] },
      select: { email: true, name: true },
    })
    if (existing?.email === email.toLowerCase()) {
      return NextResponse.json({ error: 'このメールアドレスは既に使用されています' }, { status: 409 })
    }
    if (existing?.name === name.trim()) {
      return NextResponse.json({ error: 'この名前は既に使用されています' }, { status: 409 })
    }

    const passwordHash = await bcrypt.hash(password, 12)
    await prisma.user.create({
      data: { name: name.trim(), email: email.toLowerCase(), passwordHash },
    })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: '登録に失敗しました' }, { status: 500 })
  }
}
