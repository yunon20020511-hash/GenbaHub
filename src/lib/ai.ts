import Groq from 'groq-sdk'

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
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) return mockStructure(rawInput, authorName)

  const groq = new Groq({ apiKey })

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      temperature: 0.3,
      max_tokens: 2048,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `あなたはSESエンジニア向けの技術文書アシスタントです。
エンジニアが入力した雑然としたメモを読みやすい技術記事に整形します。
必ず指定されたJSON形式のみで出力してください。`,
        },
        {
          role: 'user',
          content: `入力メモ:
${rawInput}

以下のJSON形式で出力してください:
{
  "title": "技術記事のタイトル（日本語、50文字以内）",
  "summary": "記事の要約（2〜3文、日本語）",
  "content": "技術記事の本文（Markdown形式、日本語。## 見出しで構造化し、コードは\`\`\`言語名 で囲む。500文字以上）",
  "tags": ["タグ1", "タグ2"],
  "advice": "ベストプラクティスのアドバイス（1文、日本語）"
}

tagsはReact, TypeScript, Docker, Python, AWS, エラー解決など技術キーワードを最大6個。`,
        },
      ],
    })

    const text = completion.choices[0].message.content ?? ''
    return JSON.parse(text)
  } catch (e) {
    console.error('Groq API error:', e)
    return mockStructure(rawInput, authorName)
  }
}

function mockStructure(rawInput: string, _authorName: string): StructuredPost {
  const firstLine = rawInput.split('\n')[0].slice(0, 50)
  return {
    title: firstLine || 'ナレッジメモ',
    summary: `技術メモです。${rawInput.slice(0, 80)}${rawInput.length > 80 ? '...' : ''}`,
    content: `## 概要\n\n${rawInput}\n\n## まとめ\n\nこの内容を技術記事として整理しました。\n\n> GROQ_API_KEY を .env.local に設定するとAI整形が有効になります。`,
    tags: ['メモ', '技術情報'],
    advice: 'GROQ_API_KEY を .env.local に設定するとAI整形が有効になります。',
  }
}
