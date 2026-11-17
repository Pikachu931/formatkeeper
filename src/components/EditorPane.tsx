import { Loader2, Sparkles, Upload } from 'lucide-react'
import { useRef, type ChangeEvent } from 'react'
import { MAX_INPUT_CHARS } from '../lib/analysis'

type EditorPaneProps = {
  value: string
  onChange: (value: string) => void
  charCount: number
  wordCount: number
  onAnalyze: () => void
  aiLoading: boolean
  aiError: string
}

const MAX_UPLOAD_BYTES = 2 * 1024 * 1024

export function EditorPane({
  value,
  onChange,
  charCount,
  wordCount,
  onAnalyze,
  aiLoading,
  aiError,
}: EditorPaneProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const overLimit = charCount > MAX_INPUT_CHARS

  const handleUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file || file.size > MAX_UPLOAD_BYTES) return
    onChange(await file.text())
  }

  return (
    <section
      aria-label="Markdown input"
      className="editor-pane premium-panel no-print flex min-h-[44vh] min-w-0 flex-col overflow-hidden transition-shadow lg:min-h-0"
    >
      <div className="flex shrink-0 items-start justify-between gap-3 px-5 pt-4 pb-3 sm:px-6">
        <div className="min-w-0 flex-1">
          <h2 className="display-face text-[21px] leading-none text-ink">Markdown</h2>
          <div className="pane-divider mt-3.5" aria-hidden="true" />
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            aria-label="Upload a text file"
            title="Upload a .txt or .md file"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-panel-soft hover:text-ink focus-visible:ring-1 focus-visible:ring-accent/60 focus-visible:outline-none"
          >
            <Upload className="h-[14px] w-[14px]" strokeWidth={1.7} aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={onAnalyze}
            disabled={aiLoading || !value.trim()}
            aria-busy={aiLoading}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-line bg-panel-soft px-2.5 text-[11.5px] font-medium text-ink transition-colors hover:border-line-strong disabled:pointer-events-none disabled:opacity-45 focus-visible:ring-1 focus-visible:ring-accent/60 focus-visible:outline-none"
          >
            {aiLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
            ) : (
              <Sparkles className="h-3.5 w-3.5" strokeWidth={1.7} aria-hidden="true" />
            )}
            <span className="hidden sm:inline">Analyze with AI</span>
            <span className="sm:hidden">Analyze</span>
          </button>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept=".md,.markdown,.txt,text/plain,text/markdown"
          className="hidden"
          onChange={handleUpload}
          aria-hidden="true"
          tabIndex={-1}
        />
      </div>

      {aiError ? (
        <p
          role="alert"
          className="px-5 pb-2 text-[11.5px] leading-relaxed text-rose-600 dark:text-rose-300 sm:px-6"
        >
          {aiError}
        </p>
      ) : null}

      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Paste your ChatGPT or Gemini response here..."
        aria-label="Raw Markdown, LaTeX and table content"
        spellCheck={false}
        autoCorrect="off"
        autoCapitalize="off"
        className="keeper-editor keeper-scroll min-h-[220px] w-full flex-1 px-5 py-2 font-mono text-[12.5px] leading-[1.8] text-ink sm:px-6 sm:text-[13px]"
      />

      <footer className="flex shrink-0 items-center gap-3 px-5 pt-2 pb-4 sm:px-6">
        <div className="inline-flex items-center gap-3 rounded-lg border border-line/70 bg-panel-soft px-3 py-1.5 text-[11px] tabular-nums text-muted">
          <span className={overLimit ? 'text-rose-600 dark:text-rose-300' : undefined}>
            {charCount.toLocaleString()} characters
          </span>
          <span>{wordCount.toLocaleString()} words</span>
          <span className="text-faint">max {MAX_INPUT_CHARS.toLocaleString()}</span>
        </div>
      </footer>
    </section>
  )
}
