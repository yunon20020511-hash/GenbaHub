import { NextResponse } from 'next/server'
import Groq from 'groq-sdk'

export async function POST(request: Request) {
  const { query } = await request.json()
  const apiKey = process.env.GROQ_API_KEY

  if (!apiKey) {
    return NextResponse.json({
      advice: `「${query}」に関するナレッジはまだ登録されていません。公式ドキュメントや Stack Overflow を参照し、解決できたらぜひ Genba Hub に投稿してチームで共有しましょう！`,
      relatedSkills: [],
      steps: ['公式ドキュメントを確認する', 'Stack Overflow / Qiita で検索する', '解決したら Genba Hub に投稿する'],
    })
  }

  const groq = new Groq({ apiKey })
  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      temperature: 0.5,
      max_tokens: 1024,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `あなたはSESエンジニアを支援するテクニカルアドバイザーです。
社内ナレッジベースに検索結果がなかった場合に、実践的なアドバイスを提供します。
JSON形式のみで回答してください。`,
        },
        {
          role: 'user',
          content: `SESエンジニアが「${query}」で検索しましたが、社内ナレッジが見つかりませんでした。

以下のJSON形式でアドバイスをください:
{
  "advice": "具体的で実践的なアドバイス（日本語、150文字以内）",
  "relatedSkills": ["関連技術1", "関連技術2", "関連技術3"],
  "steps": ["すぐに試せるアプローチ1", "アプローチ2", "アプローチ3"]
}`,
        },
      ],
    })

    const text = completion.choices[0].message.content ?? '{}'
    return NextResponse.json(JSON.parse(text))
  } catch {
    return NextResponse.json({
      advice: `「${query}」について、まず公式ドキュメントと Stack Overflow / Qiita を確認してみましょう。解決できたら Genba Hub に投稿してチームで共有してください！`,
      relatedSkills: [],
      steps: ['公式ドキュメントを確認する', 'Stack Overflow / Qiita で検索する', '解決したら Genba Hub に投稿する'],
    })
  }
}
