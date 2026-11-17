import { describe, expect, it } from 'vitest'
import { buildPlainText, buildRichHtml } from './clipboard'

function mount(html: string): HTMLElement {
  const root = document.createElement('div')
  root.innerHTML = html
  document.body.appendChild(root)
  return root
}

const KATEX = `<span class="katex"><span class="katex-mathml"><math><semantics><mrow><mi>x</mi></mrow><annotation encoding="application/x-tex">x^2 + 1</annotation></semantics></math></span><span class="katex-html" aria-hidden="true">x2+1</span></span>`

describe('buildRichHtml', () => {
  it('marks Word fragments and keeps a light document palette', () => {
    const html = buildRichHtml(mount('<p>Hello</p>'))
    expect(html).toContain('<!--StartFragment-->')
    expect(html).toContain('<!--EndFragment-->')
    expect(html).toMatch(/<p[^>]*>Hello<\/p>/)
    expect(html).toContain('<meta charset="utf-8">')
  })

  it('emits legacy table attributes editors keep when CSS is dropped', () => {
    const html = buildRichHtml(
      mount('<table><thead><tr><th>A</th></tr></thead><tbody><tr><td>1</td></tr></tbody></table>'),
    )
    expect(html).toContain('border="1"')
    expect(html).toContain('cellpadding="8"')
    expect(html).toContain('width="100%"')
    expect(html).toContain('mso-table-lspace:0pt')
  })

  it('renders horizontal rules as a visible border instead of a background', () => {
    const html = buildRichHtml(mount('<hr>'))
    expect(html).toContain('border-top:1px solid #d6dae4')
    expect(html).not.toContain('<hr style=""')
  })

  it('unwraps the paragraph inside a loose list item so Docs keeps the list', () => {
    const html = buildRichHtml(mount('<ul><li><p>First</p></li><li><p>Second</p></li></ul>'))
    expect(html).not.toMatch(/<li[^>]*><p/)
    expect(html).toContain('First')
    expect(html).toContain('Second')
  })

  it('sizes pasted images so they cannot overflow the document', () => {
    const html = buildRichHtml(mount('<img src="https://example.com/a.png" alt="A">'))
    expect(html).toContain('max-width:100%')
    expect(html).toContain('height:auto')
  })

  it('emits MathML and a TeX fallback by default, and only one per target', () => {
    const auto = buildRichHtml(mount(KATEX))
    expect(auto).toContain('<math')
    expect(auto).toContain('mso-hide:all')

    const docs = buildRichHtml(mount(KATEX), 'docs')
    expect(docs).not.toContain('<math')
    expect(docs).toContain('x^2 + 1')

    const word = buildRichHtml(mount(KATEX), 'word')
    expect(word).toContain('<math')
    expect(word).not.toContain('mso-hide:all')
  })
})

describe('buildPlainText', () => {
  it('keeps real LaTeX and task-list markers', () => {
    const text = buildPlainText(
      mount(
        `<p>Solve ${KATEX}</p><ul class="contains-task-list"><li class="task-list-item"><input type="checkbox" checked>Done</li></ul>`,
      ),
    )
    expect(text).toContain('$x^2 + 1$')
    expect(text).toContain('☑ Done')
    expect(text).not.toContain('x2+1')
  })

  it('indents nested list items without repeating the parent marker', () => {
    const text = buildPlainText(
      mount('<ul><li>One<ul><li>Nested</li></ul></li></ul>'),
    )
    expect(text).toContain('- One')
    expect(text).toContain('  - Nested')
  })
})
