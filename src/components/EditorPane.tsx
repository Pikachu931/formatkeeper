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
      className="editor-pane no-print flex min-h-[44vh] min-w-0 flex-col overflow-hidden rounded-xl border border-line bg-panel transition-colors duration-150 focus-within:border-line-strong lg:min-h-0"
    >
      <div className="flex shrink-0 items-center gap-2 border-b border-line px-4 py-2">
        <PenLine className="h-[13px] w-[13px] text-faint" aria-hidden="true" />
        <h2 className="text-[12.5px] font-medium text-muted">Markdown</h2>
      </div>

      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Paste your ChatGPT or Gemini response here..."
        aria-label="Raw Markdown, LaTeX and table content"
        spellCheck={false}
        autoCorrect="off"
        autoCapitalize="off"
        className="keeper-editor keeper-scroll min-h-[220px] w-full flex-1 px-4 py-3.5 font-mono text-[12.5px] leading-[1.8] text-ink sm:text-[13px]"
      />

      <footer className="flex shrink-0 items-center gap-3 border-t border-line px-4 py-1.5 text-[11px] tabular-nums text-faint">
        <span>
          <span className="text-muted">{charCount.toLocaleString()}</span> characters
        </span>
        <span aria-hidden="true" className="h-3 w-px bg-line" />
        <span>
          <span className="text-muted">{wordCount.toLocaleString()}</span> words
        </span>
      </footer>
    </section>
  )
}
