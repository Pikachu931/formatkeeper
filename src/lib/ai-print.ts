import type { StyleSpec } from './analysis'

const STYLE_ID = 'formatkeeper-ai-page'

/**
 * The chosen layout supplies its own margins; they are injected as an @page
 * rule after the bundled print stylesheet so the print dialog honours them.
 */
export function applyAiPageMargins(margins: StyleSpec['margins']): void {
  let style = document.getElementById(STYLE_ID) as HTMLStyleElement | null
  if (!style) {
    style = document.createElement('style')
    style.id = STYLE_ID
    document.head.appendChild(style)
  }
  style.textContent = `@media print { @page { size: A4 portrait; margin: ${margins.top}mm ${margins.right}mm ${margins.bottom}mm ${margins.left}mm; } }`
}

export function clearAiPrintState(): void {
  document.body.classList.remove('ai-printing')
  document.getElementById(STYLE_ID)?.remove()
}
