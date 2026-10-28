/**
 * Rich-text clipboard support.
 *
 * The preview is serialized from the live DOM with computed styles baked into
 * inline `style` attributes, because rich-text editors (Google Docs, Word,
 * Notion) ignore the page stylesheet but honour inline styles.
 *
 * While serializing, `.copy-light` is applied to the preview root so the output
 * always uses the light palette — near-white text pasted into a white document
 * would be unreadable.
 */

const INLINE_PROPS = [
  'color',
  'background-color',
  'font-family',
  'font-size',
  'font-weight',
  'font-style',
  'font-variant',
  'letter-spacing',
  'line-height',
  'text-align',
  'text-decoration-line',
  'text-decoration-color',
  'text-transform',
  'white-space',
  'vertical-align',
  'border-collapse',
  'border-spacing',
  'border-radius',
  'list-style-type',
  'list-style-position',
  'padding-top',
  'padding-right',
  'padding-bottom',
  'padding-left',
  'margin-top',
  'margin-bottom',
  'border-top-width',
  'border-top-style',
  'border-top-color',
  'border-right-width',
  'border-right-style',
  'border-right-color',
  'border-bottom-width',
  'border-bottom-style',
  'border-bottom-color',
  'border-left-width',
  'border-left-style',
  'border-left-color',
] as const

const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'SVG', 'NOSCRIPT', 'TEXTAREA', 'BUTTON'])
const VOID_TAGS = new Set(['BR', 'HR', 'IMG', 'SOURCE', 'COL'])

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function escapeAttr(value: string): string {
  return escapeHtml(value).replace(/"/g, '&quot;')
}

function isTransparent(value: string): boolean {
  return value === 'transparent' || value === 'rgba(0, 0, 0, 0)' || value === 'hsla(0, 0%, 0%, 0)'
}

type ElementStyle = { style: string; whiteSpace: string }

function styleFor(el: Element): ElementStyle {
  const computed = window.getComputedStyle(el)
  const parts: string[] = []
  const whiteSpace = computed.getPropertyValue('white-space').trim()

  for (const prop of INLINE_PROPS) {
    const value = computed.getPropertyValue(prop).trim()
    if (!value) continue
    if (prop === 'background-color' && isTransparent(value)) continue
    if (prop === 'border-radius' && value === '0px') continue
    if (prop === 'text-decoration-line' && value === 'none') continue
    if (prop.endsWith('-width') && value === '0px') continue
    if (prop.endsWith('-style') && value === 'none') continue
    if ((prop.startsWith('padding-') || prop.startsWith('margin-')) && value === '0px') continue
    parts.push(`${prop}:${value}`)
  }

  return { style: parts.join(';'), whiteSpace }
}

/** KaTeX renders raw HTML spans; paste the original TeX instead. */
function mathToString(el: Element): string {
  const annotation = el.querySelector('annotation[encoding="application/x-tex"]')
  const tex = (annotation?.textContent ?? '').replace(/\s+/g, ' ').trim()
  if (!tex) return ''
  const display = el.closest('.katex-display') !== null
  const style = display
    ? 'display:block;text-align:center;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:14px;color:#4f5fd0;padding:6px 0'
    : 'font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:14px;color:#4f5fd0;white-space:nowrap'
  return `<span style="${style}">${escapeHtml(tex)}</span>`
}

function serialize(node: Node, preserveWhitespace = false): string {
  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.textContent ?? ''
    // Outside <pre> the line breaks come from block boundaries, so collapsing
    // incidental newlines keeps pasted paragraphs tidy.
    return escapeHtml(preserveWhitespace ? text : text.replace(/\s*\n\s*/g, ' '))
  }

  if (node.nodeType !== Node.ELEMENT_NODE) return ''

  const el = node as HTMLElement
  const tag = el.tagName

  if (SKIP_TAGS.has(tag)) return ''
  if (el.classList.contains('katex')) return mathToString(el)
  if (el.getAttribute('aria-hidden') === 'true') return ''

  if (tag === 'INPUT') {
    if (el.getAttribute('type') === 'checkbox') {
      return (el as HTMLInputElement).checked ? '☑ ' : '☐ '
    }
    return ''
  }

  const name = tag.toLowerCase()
  const { style, whiteSpace } = styleFor(el)
  const styleAttr = style ? ` style="${escapeAttr(style)}"` : ''

  if (VOID_TAGS.has(tag)) {
    if (tag === 'IMG') {
      const src = el.getAttribute('src') ?? ''
      const alt = el.getAttribute('alt') ?? ''
      return `<img src="${escapeAttr(src)}" alt="${escapeAttr(alt)}"${styleAttr}>`
    }
    return `<${name}${styleAttr}>`
  }

  const preserve =
    preserveWhitespace ||
    tag === 'PRE' ||
    tag === 'CODE' ||
    /^(pre|break-spaces)/.test(whiteSpace)

  let inner = ''
  for (const child of Array.from(el.childNodes)) inner += serialize(child, preserve)

  return `<${name}${styleAttr}>${inner}</${name}>`
}

export function buildRichHtml(root: HTMLElement): string {
  root.classList.add('copy-light')
  try {
    // Force a synchronous style recalculation so `getComputedStyle` reflects
    // the light palette before values are read.
    const computed = window.getComputedStyle(root)
    const base = [
      `font-family:${computed.fontFamily}`,
      `font-size:${computed.fontSize}`,
      `line-height:${computed.lineHeight}`,
      `color:${computed.color}`,
    ].join(';')

    let body = ''
    for (const child of Array.from(root.childNodes)) body += serialize(child)

    return `<div style="${escapeAttr(base)}">${body}</div>`
  } finally {
    root.classList.remove('copy-light')
  }
}

function legacyCopy(html: string): boolean {
  const holder = document.createElement('div')
  holder.contentEditable = 'true'
  holder.innerHTML = html
  holder.style.cssText =
    'position:fixed;top:0;left:-9999px;opacity:0;white-space:pre-wrap;pointer-events:none'
  document.body.appendChild(holder)

  const selection = window.getSelection()
  const range = document.createRange()
  range.selectNodeContents(holder)
  selection?.removeAllRanges()
  selection?.addRange(range)

  let ok = false
  try {
    ok = document.execCommand('copy')
  } catch {
    ok = false
  }

  selection?.removeAllRanges()
  holder.remove()

  return ok
}

export async function copyRichText(root: HTMLElement): Promise<boolean> {
  const html = buildRichHtml(root)
  const text = root.innerText.trim()

  try {
    if (typeof ClipboardItem !== 'undefined' && navigator.clipboard?.write) {
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/html': new Blob([html], { type: 'text/html' }),
          'text/plain': new Blob([text], { type: 'text/plain' }),
        }),
      ])
      return true
    }
  } catch {
    // Fall through to the selection-based copy below.
  }

  return legacyCopy(html)
}
