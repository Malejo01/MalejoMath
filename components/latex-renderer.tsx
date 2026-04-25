'use client'

import 'katex/dist/katex.min.css'
import { useMemo } from 'react'
import katex from 'katex'

interface LaTeXRendererProps {
  content: string
  className?: string
}

export function LaTeXRenderer({ content, className = '' }: LaTeXRendererProps) {
  const renderedContent = useMemo(() => {
    // Replace $...$ with rendered LaTeX
    const parts: (string | { type: 'latex'; content: string })[] = []
    let lastIndex = 0
    
    // Match both $...$ (inline) and $$...$$ (display)
    const regex = /\$\$([\s\S]*?)\$\$|\$((?:[^$\\]|\\.)+?)\$/g
    let match
    
    while ((match = regex.exec(content)) !== null) {
      // Add text before the match
      if (match.index > lastIndex) {
        parts.push(content.slice(lastIndex, match.index))
      }
      
      // Add the LaTeX content
      const latexContent = match[1] || match[2] // match[1] for $$, match[2] for $
      const isDisplay = match[1] !== undefined
      
      try {
        const rendered = katex.renderToString(latexContent, {
          throwOnError: false,
          displayMode: isDisplay,
          strict: false
        })
        parts.push({ type: 'latex', content: rendered })
      } catch {
        parts.push(latexContent)
      }
      
      lastIndex = match.index + match[0].length
    }
    
    // Add remaining text
    if (lastIndex < content.length) {
      parts.push(content.slice(lastIndex))
    }
    
    return parts
  }, [content])

  return (
    <span className={className}>
      {renderedContent.map((part, index) => {
        if (typeof part === 'string') {
          return <span key={index}>{part}</span>
        }
        return (
          <span
            key={index}
            dangerouslySetInnerHTML={{ __html: part.content }}
          />
        )
      })}
    </span>
  )
}
