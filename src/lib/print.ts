import type { PrintSettings } from './storage'

const PAGE_SIZE_CSS: Record<PrintSettings['pageSize'], string> = {
  A4: 'A4 portrait',
  Letter: 'Letter portrait',
}

const MARGIN_CSS: Record<PrintSettings['margin'], string> = {
  narrow: '15mm',
  normal: '25mm',
  wide: '35mm',
}

/**
 * Injects the chosen paper size and margins after the bundled print stylesheet,
 * so the browser's "Save as PDF" honours them. Called before every print.
 */
export function applyPrintSettings(settings: PrintSettings): void {
  const id = 'formatkeeper-print-settings'
  let style = document.getElementById(id) as HTMLStyleElement | null
  if (!style) {
    style = document.createElement('style')
    style.id = id
    document.head.appendChild(style)
  }
  style.textContent = `@media print { @page { size: ${PAGE_SIZE_CSS[settings.pageSize]}; margin: ${MARGIN_CSS[settings.margin]}; } }`
}
