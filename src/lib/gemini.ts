import { GoogleGenerativeAI } from '@google/generative-ai'

export interface StructuredPost {
  title: string
  summary: string
  content: string
  tags: string[]
  advice?: string
}

export async function structureKnowledge(
  rawInput: string,
  authorName: string
): Promise<StructuredPost> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return mockStructure(rawInput, authorName)

  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

  const prompt = `
You are a technical documentation assistant for SES software engineers in Japan.
Given raw notes from an engineer, structure them into a clear technical knowledge article in Japanese.

Engineer: ${authorName}
Raw notes:
${rawInput}

Respond with ONLY valid JSON (no markdown code blocks, no extra text):
{
  "title": "明確な技術タイトル（日本語）",
  "summary": "2〜3文の要約（日本語）",
  "content": "詳細な技術記事（Markdown形式、日本語）",
  "tags": ["tag1", "tag2", "tag3"],
  "advice": "ベストプラクティスのアドバイス（1文、日本語）"
}

Rules:
- tags は技術キーワード（React, TypeScript, Docker, AWS, エラー解決 など）を最大6個
- content は ## 見出し を使った Markdown 形式で500文字以上
- advice は省略可（不要な場合は空文字）
`

  try {
    const result = await model.generateContent(prompt)
    const text = result.response.text().replace(/```json\n?|\n?```/g, '').trim()
    return JSON.parse(text)
  } catch {
    return mockStructure(rawInput, authorName)
  }
}

function mockStructure(rawInput: string, authorName: string): StructuredPost {
  const firstLine = rawInput.split('\n')[0].slice(0, 50)
  return {
    title: firstLine || `${authorName}のナレッジメモ`,
    summary: `${authorName}が記録した技術メモです。${rawInput.slice(0, 80)}${rawInput.length > 80 ? '...' : ''}`,
    content: `## 概要\n\n${rawInput}\n\n## まとめ\n\n上記の内容を整理しました。Gemini APIキーを設定するとAIによる自動整形が有効になります。`,
    tags: ['メモ', '技術情報'],
    advice: 'GEMINI_API_KEY を .env.local に設定するとAI整形が有効になります。',
  }
}
