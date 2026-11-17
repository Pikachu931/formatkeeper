/**
 * Splits a markdown document into top-level blocks so the preview can re-render
 * only the block that changed. Splitting is conservative: anything whose meaning
 * depends on document-wide context (reference definitions, footnotes, block HTML)
 * is rendered as one block instead.
 */
export type MarkdownBlock = { key: string; markdown: string }

const FENCE_RE = /^ {0,3}(`{3,}|~{3,})/
const LIST_ITEM_RE = /^\s*(?:[-*+]|\d{1,9}[.)])\s+/
const BLOCK_HTML_RE =
  /^\s*<(?:address|article|aside|blockquote|details|dialog|div|dl|fieldset|figcaption|figure|footer|form|h[1-6]|header|hr|main|nav|ol|p|pre|section|table|ul|script|style)\b/i
const REFERENCE_DEFINITION_RE = /^ {0,3}\[[^\]]+\]:\s/m
const FOOTNOTE_RE = /\[\^[^\]]*\]/

/** Document-wide constructs that must be parsed in a single pass. */
function needsWholeDocument(source: string): boolean {
  if (REFERENCE_DEFINITION_RE.test(source)) return true
  if (FOOTNOTE_RE.test(source)) return true
  return source.split('\n').some((line) => BLOCK_HTML_RE.test(line))
}

function continuesPrevious(previousLastLine: string, nextFirstLine: string): boolean {
  if (LIST_ITEM_RE.test(previousLastLine)) {
    if (LIST_ITEM_RE.test(nextFirstLine)) return true
    // Short indents continue the current list item (nested list / paragraph).
    if (/^ {1,3}\S/.test(nextFirstLine)) return true
  }
  return false
}

export function splitMarkdown(source: string): MarkdownBlock[] {
  if (!source.trim()) return []
  if (needsWholeDocument(source)) return [{ key: 'doc', markdown: source }]

  const lines = source.split('\n')
  const chunks: string[] = []

  let current: string[] = []
  let fenceChar: string | null = null
  let fenceLength = 0
  let inDisplayMath = false

  const flush = () => {
    const text = current.join('\n')
    current = []
    if (!text.trim()) return

    const previous = chunks[chunks.length - 1]
    if (previous) {
      const previousLines = previous.split('\n').filter((line) => line.trim())
      const nextLines = text.split('\n').filter((line) => line.trim())
      const previousLast = previousLines[previousLines.length - 1] ?? ''
      const nextFirst = nextLines[0] ?? ''
      if (continuesPrevious(previousLast, nextFirst)) {
        chunks[chunks.length - 1] = `${previous}\n\n${text}`
        return
      }
    }

    chunks.push(text)
  }

  for (const line of lines) {
    if (fenceChar) {
      current.push(line)
      const closing = line.match(FENCE_RE)
      if (
        closing &&
        closing[1][0] === fenceChar &&
        closing[1].length >= fenceLength &&
        line.trim() === closing[1]
      ) {
        fenceChar = null
        fenceLength = 0
      }
      continue
    }

    if (inDisplayMath) {
      current.push(line)
      if (line.includes('$$')) inDisplayMath = false
      continue
    }

    const fence = line.match(FENCE_RE)
    if (fence) {
      fenceChar = fence[1][0]
      fenceLength = fence[1].length
      current.push(line)
      continue
    }

    // A blank line inside `$$ ... $$` must not split the equation.
    if ((line.match(/\$\$/g) ?? []).length % 2 === 1) {
      inDisplayMath = true
      current.push(line)
      continue
    }

    if (!line.trim()) {
      flush()
      continue
    }

    current.push(line)
  }

  flush()

  return chunks.map((markdown, index) => ({ key: `block-${index}`, markdown }))
}
