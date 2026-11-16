import { Check, Clipboard, Layers, Moon, Printer, Sparkles, Sun, Trash2 } from 'lucide-react'
import type { Theme } from '../lib/theme'

export type CopyState = 'idle' | 'copied' | 'error'

type HeaderProps = {
  hasContent: boolean
  copyState: CopyState
  theme: Theme
  onSample: () => void
  onClear: () => void
  onToggleTheme: () => void
  onCopy: () => void
  onPrint: () => void
}

const ghostButton =
  'group inline-flex h-10 items-center justify-center gap-2 rounded-lg px-2.5 text-[12.5px] font-normal tracking-[0.01em] text-muted transition-colors duration-200 hover:bg-panel-soft hover:text-ink disabled:pointer-events-none disabled:opacity-35 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent/50 sm:h-9'

const iconButton =
  'inline-flex h-10 w-10 items-center justify-center rounded-lg text-muted transition-colors duration-200 hover:bg-panel-soft hover:text-ink focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent/50 sm:h-9 sm:w-9'

export function Header({
  hasContent,
  copyState,
  theme,
  onSample,
  onClear,
  onToggleTheme,
  onCopy,
  onPrint,
}: HeaderProps) {
  const copied = copyState === 'copied'
  const failed = copyState === 'error'

  return (
    <header className="no-print relative z-10 shrink-0">
      <div className="mx-auto flex w-full max-w-[1180px] flex-wrap items-center justify-between gap-x-6 gap-y-2 px-6 py-3 sm:px-8">
        <div className="flex min-w-0 items-center gap-2.5">
          <Layers className="h-[18px] w-[18px] shrink-0 text-ink" strokeWidth={1.5} aria-hidden="true" />
          <h1 className="display-face truncate text-[19px] leading-none text-ink">FormatKeeper</h1>
        </div>

        <div className="flex w-full items-center gap-1 sm:w-auto">
          <button
            type="button"
            onClick={onSample}
            aria-label="Load sample content"
            title="Load sample content"
            className={ghostButton}
          >
            <Sparkles className="h-[14px] w-[14px]" strokeWidth={1.6} aria-hidden="true" />
            <span className="hidden sm:inline">Try Sample</span>
          </button>

          <button
            type="button"
            onClick={onClear}
            disabled={!hasContent}
            aria-label="Clear editor"
            title="Clear editor"
            className={ghostButton}
          >
            <Trash2 className="h-[14px] w-[14px]" strokeWidth={1.6} aria-hidden="true" />
            <span className="hidden sm:inline">Clear</span>
          </button>

          <button
            type="button"
            onClick={onPrint}
            disabled={!hasContent}
            aria-label="Print or save as PDF"
            title="Print or save as PDF"
            className={ghostButton}
          >
            <Printer className="h-[14px] w-[14px]" strokeWidth={1.6} aria-hidden="true" />
            <span className="hidden sm:inline">Print / PDF</span>
          </button>

          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
            className={iconButton}
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4" strokeWidth={1.6} aria-hidden="true" />
            ) : (
              <Moon className="h-4 w-4" strokeWidth={1.6} aria-hidden="true" />
            )}
          </button>

          <button
            type="button"
            onClick={onCopy}
            disabled={!hasContent || copied}
            aria-label="Copy formatted rich text"
            className={`btn-primary inline-flex h-10 min-w-0 flex-1 items-center justify-center gap-2 rounded-lg px-3.5 text-[12.5px] font-medium tracking-[0.01em] transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent/60 sm:h-9 sm:flex-none ${
              copied
                ? 'bg-emerald-500/12! text-emerald-700! dark:text-emerald-300!'
                : failed
                  ? 'bg-rose-500/12! text-rose-700! dark:text-rose-300!'
                  : ''
            }`}
          >
            {copied ? (
              <Check className="h-[15px] w-[15px]" strokeWidth={2.2} aria-hidden="true" />
            ) : (
              <Clipboard className="h-[15px] w-[15px]" strokeWidth={1.7} aria-hidden="true" />
            )}
            <span className="truncate">
              {copied ? 'Copied!' : failed ? 'Copy failed' : 'Copy Formatted'}
            </span>
          </button>
        </div>
      </div>
    </header>
  )
}
