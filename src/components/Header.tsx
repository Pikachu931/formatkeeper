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
  'group inline-flex h-10 items-center justify-center gap-1.5 rounded-lg border border-line bg-panel px-2.5 text-[12.5px] font-medium text-muted transition-all duration-150 hover:border-line-strong hover:bg-panel-soft hover:text-ink active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 sm:h-9'

const iconButton =
  'inline-flex h-10 w-10 items-center justify-center rounded-lg border border-line bg-panel text-muted transition-all duration-150 hover:border-line-strong hover:bg-panel-soft hover:text-ink active:scale-[0.94] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 sm:h-9 sm:w-9'

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
    <header className="no-print relative z-10 shrink-0 border-b border-line/90 bg-panel/70 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-[1680px] flex-wrap items-center justify-between gap-x-4 gap-y-3 px-3 py-3 sm:px-5 lg:px-7">
        <div className="flex min-w-0 items-center gap-3">
          <div className="brand-badge grid h-10 w-10 shrink-0 place-items-center rounded-xl">
            <Layers className="h-5 w-5 text-accent-strong" strokeWidth={2.1} aria-hidden="true" />
          </div>
          <div className="min-w-0 leading-tight">
            <h1 className="truncate text-[15.5px] font-semibold tracking-[-0.015em] text-ink">
              FormatKeeper
            </h1>
            <p className="mt-0.5 truncate text-[11.5px] text-muted sm:text-[12px]">
              Preserve equations, tables &amp; formatting
            </p>
          </div>
        </div>

        <div className="flex w-full items-center gap-1.5 sm:w-auto sm:gap-2">
          <button
            type="button"
            onClick={onSample}
            aria-label="Load sample content"
            className={`${ghostButton} px-2.5 sm:px-3`}
          >
            <Sparkles
              className="h-[14px] w-[14px] text-accent-strong transition-transform duration-300 group-hover:rotate-12"
              aria-hidden="true"
            />
            <span className="hidden sm:inline">Try Sample</span>
          </button>

          <button
            type="button"
            onClick={onClear}
            disabled={!hasContent}
            aria-label="Clear editor"
            className={`${ghostButton} px-2.5 sm:px-3`}
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
            className={`${ghostButton} px-2.5 sm:px-3`}
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
            className={`inline-flex h-10 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-lg px-3 text-[12.5px] font-semibold transition-all duration-150 active:scale-[0.97] disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-panel sm:h-9 sm:min-w-[9.25rem] sm:flex-none sm:px-3.5 ${
              copied
                ? 'bg-emerald-500/15 text-emerald-700 ring-1 ring-emerald-600/30 ring-inset dark:text-emerald-300 dark:ring-emerald-400/30'
                : failed
                  ? 'bg-rose-500/12 text-rose-700 ring-1 ring-rose-600/30 ring-inset dark:text-rose-300 dark:ring-rose-400/30'
                  : 'bg-ink text-panel shadow-[0_1px_2px_rgb(0_0_0/0.18)] hover:opacity-90 focus-visible:ring-accent/60 disabled:opacity-40'
            }`}
          >
            {copied ? (
              <Check className="h-[15px] w-[15px]" strokeWidth={2.6} aria-hidden="true" />
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
