import type { PasteTarget } from './clipboard'

export type PrintSettings = {
  pageSize: 'A4' | 'Letter'
  margin: 'narrow' | 'normal' | 'wide'
}

const DRAFT_KEY = 'formatkeeper-draft'
const TARGET_KEY = 'formatkeeper-paste-target'
const PRINT_KEY = 'formatkeeper-print'
/** localStorage quotas are small; a 300k-character draft is ~600 kB. */
const DRAFT_LIMIT = 300_000

export const DEFAULT_PRINT_SETTINGS: PrintSettings = { pageSize: 'A4', margin: 'normal' }

function read(key: string): string | null {
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

function write(key: string, value: string | null): void {
  try {
    if (value === null) window.localStorage.removeItem(key)
    else window.localStorage.setItem(key, value)
  } catch {
    // Private mode or a full quota: persistence is best-effort.
  }
}

export function loadDraft(): string {
  return read(DRAFT_KEY) ?? ''
}

export function saveDraft(value: string): void {
  if (!value.trim()) {
    write(DRAFT_KEY, null)
    return
  }
  if (value.length > DRAFT_LIMIT) return
  write(DRAFT_KEY, value)
}

export function loadPasteTarget(): PasteTarget {
  const value = read(TARGET_KEY)
  return value === 'docs' || value === 'word' || value === 'notion' ? value : 'auto'
}

export function savePasteTarget(target: PasteTarget): void {
  write(TARGET_KEY, target)
}

export function loadPrintSettings(): PrintSettings {
  const raw = read(PRINT_KEY)
  if (!raw) return DEFAULT_PRINT_SETTINGS
  try {
    const parsed = JSON.parse(raw) as Partial<PrintSettings>
    return {
      pageSize: parsed.pageSize === 'Letter' ? 'Letter' : 'A4',
      margin:
        parsed.margin === 'narrow' || parsed.margin === 'wide' ? parsed.margin : 'normal',
    }
  } catch {
    return DEFAULT_PRINT_SETTINGS
  }
}

export function savePrintSettings(settings: PrintSettings): void {
  write(PRINT_KEY, JSON.stringify(settings))
}
