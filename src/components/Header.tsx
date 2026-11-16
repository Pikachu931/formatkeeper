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
  'group inline-flex h-10 items-center justify-center gap-1.5 rounded-md px-2.5 text-[12.5px] font-medium text-muted transition-colors duration-150 hover:bg-panel-soft hover:text-ink disabled:pointer-events-none disabled:opacity-35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 sm:h-9'

const iconButton =
  'inline-flex h-10 w-10 items-center justify-center rounded-md text-muted transition-colors duration-150 hover:bg-panel-soft hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 sm:h-9 sm:w-9'

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
    <header className="no-print relative z-10 shrink-0 border-b border-line/80">
      <div className="mx-auto flex w-full max-w-[1440px] flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-2.5 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-2">
          <Layers className="h-4 w-4 shrink-0 text-muted" strokeWidth={1.9} aria-hidden="true" />
          <h1 className="truncate text-[14px] font-semibold tracking-[-0.01em] text-ink">
            FormatKeeper
          </h1>
        </div>

        <div className="flex w-full items-center gap-0.5 sm:w-auto sm:gap-1">
          <button
            type="button"
            onClick={onSample}
            aria-label="Load sample content"
            title="Load sample content"
            className={ghostButton}
          >
            <Sparkles className="h-[14px] w-[14px]" aria-hidden="true" />
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
            <Trash2 className="h-[14px] w-[14px]" aria-hidden="true" />
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
            <Printer className="h-[14px] w-[14px]" aria-hidden="true" />
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
              <Sun className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Moon className="h-4 w-4" aria-hidden="true" />
            )}
          </button>

          <button
            type="button"
            onClick={onCopy}
            disabled={!hasContent || copied}
            aria-label="Copy formatted rich text"
            className={`inline-flex h-10 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-md px-3 text-[12.5px] font-semibold transition-colors duration-150 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 sm:h-9 sm:min-w-[9rem] sm:flex-none ${
              copied
                ? 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-300'
                : failed
                  ? 'bg-rose-500/12 text-rose-700 dark:text-rose-300'
                  : 'bg-ink text-panel hover:opacity-90 disabled:opacity-35'
            }`}
          >
            {copied ? (
              <Check className="h-[15px] w-[15px]" strokeWidth={2.4} aria-hidden="true" />
            ) : (
              <Clipboard className="h-[15px] w-[15px]" aria-hidden="true" />
            )}
            <span className="truncate">
              {copied ? (
                'Copied!'
              ) : failed ? (
                'Copy failed'
              ) : (
                <>
                  <span className="sm:hidden">Copy</span>
                  <span className="hidden sm:inline">Copy Formatted</span>
                </>
              )}
            </span>
          </button>
        </div>
      </div>
    </header>
  )
}
