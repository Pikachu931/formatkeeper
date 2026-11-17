import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AiDocument } from './components/AiDocument'
import { AiPanel } from './components/AiPanel'
import { EditorPane } from './components/EditorPane'
import { Header, type CopyState } from './components/Header'
import { PreviewPane } from './components/PreviewPane'
import { analyzeText } from './lib/ai'
import { applyAiPageMargins, clearAiPrintState } from './lib/ai-print'
import { validateText, type Analysis, type StyleId } from './lib/analysis'
import { copyRichText } from './lib/clipboard'
import { SAMPLE_MARKDOWN } from './lib/sample'
import { applyTheme, readTheme, type Theme } from './lib/theme'

export default function App() {
  const [markdown, setMarkdown] = useState('')
  const [theme, setTheme] = useState<Theme>(readTheme)
  const [copyState, setCopyState] = useState<CopyState>('idle')
  const [generation, setGeneration] = useState(0)

  const [aiOpen, setAiOpen] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState('')
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [aiStyle, setAiStyle] = useState<StyleId>('standard')
  const [printStyle, setPrintStyle] = useState<StyleId | null>(null)

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

  // Printing the AI document hides the app for the duration of the dialog and
  // then restores it, whether the user prints or cancels.
  useEffect(() => {
    const done = () => {
      clearAiPrintState()
      setPrintStyle(null)
    }
    window.addEventListener('afterprint', done)
    return () => window.removeEventListener('afterprint', done)
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
    setAnalysis(null)
    setAiError('')
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
    setPrintStyle(null)
    window.print()
  }, [hasContent])

  const handleAnalyze = useCallback(async () => {
    const validation = validateText(markdown)
    if (!validation.ok) {
      setAiError(validation.error)
      return
    }

    setAiError('')
    setAnalysis(null)
    setAiOpen(true)
    setAiLoading(true)

    try {
      const result = await analyzeText(validation.text)
      setAnalysis(result)
      setAiStyle('standard')
    } catch (error) {
      setAiError(error instanceof Error ? error.message : 'Analysis failed. Please try again.')
    } finally {
      setAiLoading(false)
    }
  }, [markdown])

  const handleGenerate = useCallback(() => {
    if (!analysis) return
    const spec = analysis.styles[aiStyle]
    applyAiPageMargins(spec.margins)
    setPrintStyle(aiStyle)
    setAiOpen(false)
    document.body.classList.add('ai-printing')
    // Give the print document and @page rule a frame to render.
    window.setTimeout(() => window.print(), 180)
  }, [analysis, aiStyle])

  return (
    <>
      <div className="app-root app-surface relative flex min-h-[100dvh] flex-col text-ink lg:h-[100dvh] lg:overflow-hidden">
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

        <main className="relative z-10 flex min-h-0 flex-1 flex-col px-6 py-5 sm:px-8">
          <div className="workspace mx-auto grid h-full w-full max-w-[1180px] grid-cols-1 gap-6 sm:gap-8 lg:min-h-0 lg:grid-cols-2">
            <EditorPane
              value={markdown}
              onChange={setMarkdown}
              charCount={charCount}
              wordCount={wordCount}
              onAnalyze={handleAnalyze}
              aiLoading={aiLoading}
              aiError={aiError}
            />
            <PreviewPane
              markdown={markdown}
              hasContent={hasContent}
              generation={generation}
              contentRef={previewRef}
            />
          </div>
        </main>

        <footer className="no-print relative z-10 flex shrink-0 items-center justify-center px-6 py-3 text-[11px] tracking-[0.01em] text-faint sm:px-8">
          <span>© SA7 FormatKeeper. All rights reserved.</span>
        </footer>
      </div>

      {analysis && printStyle ? (
        <div
          className="ai-print"
          aria-hidden="true"
          style={{ backgroundColor: analysis.styles[printStyle].palette.background }}
        >
          <AiDocument analysis={analysis} styleId={printStyle} />
        </div>
      ) : null}

      <AiPanel
        open={aiOpen}
        loading={aiLoading}
        error={aiError}
        analysis={analysis}
        selected={aiStyle}
        onSelect={setAiStyle}
        onRetry={handleAnalyze}
        onClose={() => setAiOpen(false)}
        onGenerate={handleGenerate}
      />
    </>
  )
}
