import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { EditorPane } from './components/EditorPane'
import { Header, type CopyState } from './components/Header'
import { PreviewPane } from './components/PreviewPane'
import { copyRichText } from './lib/clipboard'
import { SAMPLE_MARKDOWN } from './lib/sample'
import { applyTheme, readTheme, type Theme } from './lib/theme'

export default function App() {
  const [markdown, setMarkdown] = useState('')
  const [theme, setTheme] = useState<Theme>(readTheme)
  const [copyState, setCopyState] = useState<CopyState>('idle')
  const [generation, setGeneration] = useState(0)

  const previewRef = useRef<HTMLDivElement>(null)
  const resetTimer = useRef<number | null>(null)

  const hasContent = markdown.trim().length > 0

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  useEffect(() => {
    return () => {
      if (resetTimer.current !== null) window.clearTimeout(resetTimer.current)
    }
  }, [])

  const { charCount, wordCount } = useMemo(() => {
    const trimmed = markdown.trim()
    return {
      charCount: markdown.length,
      wordCount: trimmed ? trimmed.split(/\s+/).length : 0,
    }
  }, [markdown])

  const scheduleReset = useCallback(() => {
    if (resetTimer.current !== null) window.clearTimeout(resetTimer.current)
    resetTimer.current = window.setTimeout(() => setCopyState('idle'), 2000)
  }, [])

  const handleSample = useCallback(() => {
    setMarkdown(SAMPLE_MARKDOWN)
    setGeneration((value) => value + 1)
    setCopyState('idle')
  }, [])

  const handleClear = useCallback(() => {
    setMarkdown('')
    setCopyState('idle')
  }, [])

  const handleCopy = useCallback(async () => {
    const target = previewRef.current
    if (!target || !hasContent) return

    const ok = await copyRichText(target)
    setCopyState(ok ? 'copied' : 'error')
    scheduleReset()
  }, [hasContent, scheduleReset])

  // The print stylesheet turns the page into a single-column, light-palette
  // document with page-break protection, so the browser's "Save as PDF" output
  // matches the preview.
  const handlePrint = useCallback(() => {
    if (!hasContent) return
    window.print()
  }, [hasContent])

  return (
    <div className="app-root relative flex min-h-[100dvh] flex-col bg-canvas text-ink lg:h-[100dvh] lg:overflow-hidden">
      <div aria-hidden="true" className="app-glow pointer-events-none absolute inset-x-0 top-0 h-[26rem]" />

      <Header
        hasContent={hasContent}
        copyState={copyState}
        theme={theme}
        onSample={handleSample}
        onClear={handleClear}
        onToggleTheme={() => setTheme((value) => (value === 'dark' ? 'light' : 'dark'))}
        onCopy={handleCopy}
        onPrint={handlePrint}
      />

      <main className="relative flex min-h-0 flex-1 flex-col px-3 py-3 sm:px-5 sm:py-4 lg:px-7 lg:py-5">
        <div className="workspace mx-auto grid h-full w-full max-w-[1680px] grid-cols-1 gap-3 sm:gap-4 lg:min-h-0 lg:grid-cols-2">
          <EditorPane
            value={markdown}
            onChange={setMarkdown}
            charCount={charCount}
            wordCount={wordCount}
          />
          <PreviewPane
            markdown={markdown}
            hasContent={hasContent}
            generation={generation}
            contentRef={previewRef}
          />
        </div>
      </main>

      <footer className="no-print relative z-10 flex shrink-0 items-center justify-between gap-3 border-t border-line/80 px-3 py-2 text-[11px] text-faint sm:px-5 lg:px-7">
        <span>© SA7</span>
        <span className="hidden sm:inline">Markdown · GFM · LaTeX</span>
      </footer>
    </div>
  )
}
