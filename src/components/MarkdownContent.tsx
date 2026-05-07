'use client'

import { marked } from 'marked'
import { useMemo } from 'react'

marked.use({
  gfm: true,
  breaks: true,
})

export default function MarkdownContent({ content }: { content: string }) {
  const html = useMemo(() => marked.parse(content) as string, [content])
  return (
    <div
      className="markdown-content"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
