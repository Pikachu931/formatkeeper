import { describe, expect, it } from 'vitest'
import { splitMarkdown } from './blocks'

describe('splitMarkdown', () => {
  it('keeps a display equation together across blank lines', () => {
    const blocks = splitMarkdown('Before\n\n$$\na = b\n\nc = d\n$$\n\nAfter')
    expect(blocks).toHaveLength(3)
    expect(blocks[1].markdown).toContain('c = d')
  })

  it('keeps fenced code together and ignores fences for splitting', () => {
    const blocks = splitMarkdown('```ts\nconst a = 1\n\nconst b = 2\n```\n\nText')
    expect(blocks).toHaveLength(2)
    expect(blocks[0].markdown).toContain('const b = 2')
  })

  it('merges an indented continuation into the list item above it', () => {
    const blocks = splitMarkdown('- first\n\n  continued paragraph\n\n- second')
    expect(blocks[0].markdown).toContain('continued paragraph')
    expect(blocks).toHaveLength(2)
  })

  it('falls back to one block for footnotes and reference definitions', () => {
    expect(splitMarkdown('A[^1]\n\n[^1]: note\n\nAnother paragraph')).toHaveLength(1)
    expect(splitMarkdown('[ref]: https://example.com\n\nUses [ref].')).toHaveLength(1)
  })

  it('returns nothing for whitespace-only input', () => {
    expect(splitMarkdown('   \n\n  ')).toEqual([])
  })
})
