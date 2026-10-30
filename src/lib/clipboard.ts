/**
 * Rich-text clipboard support.
 *
 * The preview is serialized from the live DOM with computed styles baked into
 * inline attributes, because editors (Google Docs, Word, Notion) ignore the
 * page stylesheet but honour inline styles and legacy table attributes.
 *
 * Math is the hard part: Microsoft Word converts MathML into native equations,
 * while Google Docs and Notion strip `<math>` outright. So every equation is
 * emitted as MathML *plus* a TeX text fallback that Word hides (`mso-hide:all`)
 * and Docs/Notion keep as readable text.
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
const BLOCK_TAGS = new Set([
  'ADDRESS',
  'ARTICLE',
  'ASIDE',
  'BLOCKQUOTE',
  'DIV',
  'DL',
  'FIELDSET',
  'FIGCAPTION',
  'FIGURE',
  'FOOTER',
  'FORM',
  'H1',
  'H2',
  'H3',
  'H4',
  'H5',
  'H6',
  'HEADER',
  'HR',
  'MAIN',
  'NAV',
  'OL',
  'P',
  'PRE',
  'SECTION',
  'TABLE',
  'TR',
  'UL',
])

/** Baseline cell styling: editors that drop CSS still need visible tables. */
const CELL_STYLE = 'border:1px solid #d6dae4;padding:6px 10px;vertical-align:top'
const HEADER_CELL_STYLE = `${CELL_STYLE};background-color:#f5f6fa;font-weight:bold`
const PRE_STYLE =
  'font-family:Consolas,"Courier New",monospace;font-size:13px;line-height:1.6;background-color:#f6f7fb;border:1px solid #e2e5ee;border-radius:6px;padding:12px;white-space:pre-wrap'
const MATH_FALLBACK_STYLE =
  'font-family:Consolas,"Courier New",monospace;font-size:13px;color:#3d4cbb;mso-hide:all'

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

function texOf(el: Element): string {
  const annotation = el.querySelector('annotation[encoding="application/x-tex"]')
  return (annotation?.textContent ?? '').replace(/\s+/g, ' ').trim()
}

/**
 * MathML for Word, TeX text for everyone else. The fallback carries
 * `mso-hide:all`, which Word honours and Docs/Notion ignore, so the equation is
 * never duplicated in Word and never lost in Docs.
 */
function mathHtml(el: Element): string {
  const tex = texOf(el)
  const mathml = el.querySelector('math')?.outerHTML ?? ''
  const fallback = tex ? `<span style="${MATH_FALLBACK_STYLE}">${escapeHtml(tex)}</span>` : ''
  const display = el.closest('.katex-display') !== null

  if (display) {
    return `<p style="margin:12px 0;text-align:center">${mathml}${fallback}</p>`
  }
  return `<span style="vertical-align:baseline">${mathml}${fallback}</span>`
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
  if (el.classList.contains('katex')) return mathHtml(el)
  if (el.getAttribute('aria-hidden') === 'true') return ''

  if (tag === 'INPUT') {
    if (el.getAttribute('type') === 'checkbox') {
      return (el as HTMLInputElement).checked ? '☑ ' : '☐ '
    }
    return ''
  }

  const name = tag.toLowerCase()
  const { style, whiteSpace } = styleFor(el)

  let extra = ''
  if (tag === 'TH') extra = `;${HEADER_CELL_STYLE}`
  else if (tag === 'TD') extra = `;${CELL_STYLE}`
  else if (tag === 'PRE') extra = `;${PRE_STYLE}`

  const styleAttr = style || extra ? ` style="${escapeAttr(`${style}${extra}`)}"` : ''

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

  // Legacy attributes survive sanitizers that drop CSS borders entirely.
  if (tag === 'TABLE') {
    const start = el.getAttribute('start')
    return `<table border="1" cellpadding="8" cellspacing="0"${start ? ` start="${start}"` : ''}${styleAttr}>${inner}</table>`
  }

  const start = el.getAttribute('start')
  const startAttr = tag === 'OL' && start ? ` start="${escapeAttr(start)}"` : ''

  return `<${name}${startAttr}${styleAttr}>${inner}</${name}>`
}

export function buildRichHtml(root: HTMLElement): string {
  root.classList.add('copy-light')
  try {
    // Force a synchronous style recalculation so `getComputedStyle` reflects
    // the light palette before values are read.
    const computed = window.getComputedStyle(root)
    const bodyStyle = [
      'margin:0',
      `font-family:${computed.fontFamily}`,
      `font-size:${computed.fontSize}`,
      `line-height:${computed.lineHeight}`,
      `color:${computed.color}`,
    ].join(';')

    let body = ''
    for (const child of Array.from(root.childNodes)) body += serialize(child)

    return [
      '<!DOCTYPE html><html><head><meta charset="utf-8"></head>',
      `<body style="${escapeAttr(bodyStyle)}">`,
      body,
      '</body></html>',
    ].join('')
  } finally {
    root.classList.remove('copy-light')
  }
}

/** Plain-text flavor: real LaTeX instead of KaTeX markup or duplicated math. */
export function buildPlainText(root: HTMLElement): string {
  const chunks: string[] = []

  const walk = (node: Node, preserve: boolean) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent ?? ''
      chunks.push(preserve ? text : text.replace(/\s+/g, ' '))
      return
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return

    const el = node as HTMLElement
    const tag = el.tagName
    if (SKIP_TAGS.has(tag)) return

    if (el.classList.contains('katex')) {
      const tex = texOf(el)
      if (tex) chunks.push(el.closest('.katex-display') ? `\n\n$$\n${tex}\n$$\n\n` : `$${tex}$`)
      return
    }

    if (tag === 'INPUT') {
      if (el.getAttribute('type') === 'checkbox') {
        chunks.push((el as HTMLInputElement).checked ? '☑ ' : '☐ ')
      }
      return
    }

    if (tag === 'BR') {
      chunks.push('\n')
      return
    }

    if (tag === 'LI') {
      const parent = el.parentElement
      const ordered = parent?.tagName === 'OL'
      const index = parent ? Array.prototype.indexOf.call(parent.children, el) + 1 : 1
      let depth = 0
      for (let p = el.parentElement; p; p = p.parentElement) {
        if (p.tagName === 'UL' || p.tagName === 'OL') depth += 1
      }
      const marker = ordered ? `${index}.` : '-'
      chunks.push(`\n${'  '.repeat(Math.max(0, depth - 1))}${marker} `)
      for (const child of Array.from(el.childNodes)) walk(child, preserve)
      return
    }

    const block = BLOCK_TAGS.has(tag)
    if (block) chunks.push('\n')

    const nextPreserve = preserve || tag === 'PRE'
    for (const child of Array.from(el.childNodes)) walk(child, nextPreserve)

    if (tag === 'TD' || tag === 'TH') chunks.push('\t')
    if (block) chunks.push('\n')
  }

  for (const child of Array.from(root.childNodes)) walk(child, false)

  return chunks
    .join('')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
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
  const text = buildPlainText(root)

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
