'use client'

import { marked } from 'marked'
import { useMemo } from 'react'
import DOMPurify from 'isomorphic-dompurify'

marked.use({
  gfm: true,
  breaks: true,
})

export default function MarkdownContent({ content }: { content: string }) {
  const html = useMemo(() => {
    const rawHtml = marked.parse(content) as string
    return DOMPurify.sanitize(rawHtml)
  }, [content])

  return (
    <div
      className="markdown-content"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
