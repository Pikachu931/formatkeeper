import { PenLine } from 'lucide-react'

type EditorPaneProps = {
  value: string
  onChange: (value: string) => void
  charCount: number
  wordCount: number
}

export function EditorPane({ value, onChange, charCount, wordCount }: EditorPaneProps) {
  return (
    <section
      aria-label="Markdown input"
      className="editor-pane no-print flex min-h-[44vh] min-w-0 flex-col overflow-hidden rounded-2xl border border-line bg-panel shadow-[var(--panel-shadow)] transition-[border-color,box-shadow] duration-200 focus-within:border-[color-mix(in_srgb,var(--accent)_45%,var(--line))] focus-within:ring-1 focus-within:ring-[color-mix(in_srgb,var(--accent)_35%,transparent)] lg:min-h-0"
    >
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-line bg-panel-soft/70 px-3.5 py-2.5 sm:px-4">
        <div className="flex items-center gap-2">
          <PenLine className="h-[13px] w-[13px] text-accent-strong" aria-hidden="true" />
          <h2 className="text-[10.5px] font-semibold tracking-[0.16em] text-muted uppercase">
            Paste Content
          </h2>
        </div>
        <p className="hidden truncate text-[11px] text-faint sm:block">
          Supports Markdown, LaTeX, tables
        </p>
      </div>

      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Paste your ChatGPT or Gemini response here..."
        aria-label="Raw Markdown, LaTeX and table content"
        spellCheck={false}
        autoCorrect="off"
        autoCapitalize="off"
        className="keeper-editor keeper-scroll min-h-[220px] w-full flex-1 px-3.5 py-3.5 font-mono text-[12.5px] leading-[1.8] text-ink sm:px-4 sm:text-[13px]"
      />

      <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-line bg-panel-soft/50 px-3.5 py-2 sm:px-4">
        <div className="flex items-center gap-3 text-[11px] tabular-nums text-faint">
          <span>
            <span className="font-medium text-muted">{charCount.toLocaleString()}</span> characters
          </span>
          <span aria-hidden="true" className="h-3 w-px bg-line" />
          <span>
            <span className="font-medium text-muted">{wordCount.toLocaleString()}</span> words
          </span>
        </div>
        <span className="hidden items-center gap-1.5 text-[10.5px] text-faint sm:flex">
          <kbd className="rounded border border-line bg-panel px-1 py-0.5 font-mono text-[10px] text-muted">
            Markdown
          </kbd>
          <span aria-hidden="true">·</span>
          <kbd className="rounded border border-line bg-panel px-1 py-0.5 font-mono text-[10px] text-muted">
            GFM
          </kbd>
          <span aria-hidden="true">·</span>
          <kbd className="rounded border border-line bg-panel px-1 py-0.5 font-mono text-[10px] text-muted">
            TeX
          </kbd>
        </span>
      </footer>
    </section>
  )
}
