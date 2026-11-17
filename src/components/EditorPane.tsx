import { useState, type DragEvent } from 'react'

type EditorPaneProps = {
  value: string
  onChange: (value: string) => void
  charCount: number
  wordCount: number
  onFileDrop: (file: File) => void
}

export function EditorPane({ value, onChange, charCount, wordCount, onFileDrop }: EditorPaneProps) {
  const [dragging, setDragging] = useState(false)

  const handleDrop = (event: DragEvent<HTMLElement>) => {
    event.preventDefault()
    setDragging(false)
    const file = event.dataTransfer.files?.[0]
    if (file) onFileDrop(file)
  }

  return (
    <section
      aria-label="Markdown input"
      onDragOver={(event) => {
        event.preventDefault()
        setDragging(true)
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={`editor-pane premium-panel no-print flex min-h-[44vh] min-w-0 flex-col overflow-hidden transition-shadow lg:min-h-0 ${
        dragging ? 'ring-1 ring-accent/70' : ''
      }`}
    >
      <div className="shrink-0 px-5 pt-4 pb-3 sm:px-6">
        <h2 className="display-face text-[21px] leading-none text-ink">Markdown</h2>
        <div className="pane-divider mt-3.5" aria-hidden="true" />
      </div>

      <textarea
        id="markdown-input"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Paste your ChatGPT or Gemini response here..."
        aria-label="Raw Markdown, LaTeX and table content"
        spellCheck={false}
        autoCorrect="off"
        autoCapitalize="off"
        className="keeper-editor keeper-scroll min-h-[220px] w-full flex-1 px-5 py-2 font-mono text-[12.5px] leading-[1.8] text-ink sm:px-6 sm:text-[13px]"
      />

      <footer className="shrink-0 px-5 pt-2 pb-4 sm:px-6">
        <div className="inline-flex items-center gap-4 rounded-lg border border-line/70 bg-panel-soft px-3 py-1.5 text-[11px] tabular-nums text-muted">
          <span>{charCount.toLocaleString()} characters</span>
          <span>{wordCount.toLocaleString()} words</span>
        </div>
      </footer>
    </section>
  )
}
