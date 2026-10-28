import { memo, useMemo } from 'react'
import ReactMarkdown, { type Components } from 'react-markdown'
import rehypeHighlight from 'rehype-highlight'
import rehypeKatex from 'rehype-katex'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import { splitMarkdown } from '../lib/blocks'

const components: Components = {
  a: ({ node: _node, ...props }) => (
    <a {...props} target="_blank" rel="noreferrer noopener" />
  ),
  table: ({ node: _node, ...props }) => (
    <div className="md-table-wrap keeper-scroll">
      <table {...props} />
    </div>
  ),
  img: ({ node: _node, ...props }) => <img {...props} loading="lazy" decoding="async" />,
}

const remarkPlugins = [remarkGfm, remarkMath]
const rehypePlugins = [
  [rehypeKatex, { throwOnError: false, strict: false }],
  [rehypeHighlight, { detect: false, ignoreMissing: true }],
] satisfies Parameters<typeof ReactMarkdown>[0]['rehypePlugins']

/**
 * One top-level markdown block. Memoized on its source text, so editing one
 * paragraph re-parses and re-renders just that paragraph instead of the whole
 * document (React tree construction was the dominant cost per keystroke).
 */
const MarkdownBlock = memo(function MarkdownBlock({ markdown }: { markdown: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={remarkPlugins}
      rehypePlugins={rehypePlugins}
      components={components}
    >
      {markdown}
    </ReactMarkdown>
  )
})

type MarkdownViewProps = {
  markdown: string
  contentRef: React.RefObject<HTMLDivElement | null>
}

export const MarkdownView = memo(function MarkdownView({
  markdown,
  contentRef,
}: MarkdownViewProps) {
  const blocks = useMemo(() => splitMarkdown(markdown), [markdown])

  return (
    <div ref={contentRef} className="md-body">
      {blocks.map((block) => (
        <MarkdownBlock key={block.key} markdown={block.markdown} />
      ))}
    </div>
  )
})
