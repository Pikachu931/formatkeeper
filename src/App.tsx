import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react'
import { EditorPane } from './components/EditorPane'
import { Header, type CopyState } from './components/Header'
import { PreviewPane } from './components/PreviewPane'
import { PrintDialog } from './components/PrintDialog'
import { Toast, type ToastState } from './components/Toast'
import { copyRichText, type PasteTarget } from './lib/clipboard'
import { downloadMarkdown, readDroppedFile } from './lib/file'
import { applyPrintSettings } from './lib/print'
import { SAMPLE_MARKDOWN } from './lib/sample'
import {
  loadDraft,
  loadPasteTarget,
  loadPrintSettings,
  saveDraft,
  savePasteTarget,
  savePrintSettings,
  type PrintSettings,
} from './lib/storage'
import { applyTheme, readTheme, type Theme } from './lib/theme'

export default function App() {
  const [markdown, setMarkdown] = useState<string>(loadDraft)
  const [theme, setTheme] = useState<Theme>(readTheme)
  const [copyState, setCopyState] = useState<CopyState>('idle')
  const [generation, setGeneration] = useState(0)
  const [pasteTarget, setPasteTarget] = useState<PasteTarget>(loadPasteTarget)
  const [printSettings, setPrintSettings] = useState<PrintSettings>(loadPrintSettings)
  const [printOpen, setPrintOpen] = useState(false)
  const [toast, setToast] = useState<ToastState>(null)
  const [announcement, setAnnouncement] = useState('')

  const previewRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const resetTimer = useRef<number | null>(null)

  const hasContent = markdown.trim().length > 0

  useEffect(() => {
    applyTheme(theme)
  }, [theme])

  // Draft recovery: the editor is the only copy of the document, so it is
  // persisted locally (never uploaded) shortly after typing stops.
  useEffect(() => {
    const timer = window.setTimeout(() => saveDraft(markdown), 400)
    return () => window.clearTimeout(timer)
  }, [markdown])

  useEffect(() => {
    return () => {
      if (resetTimer.current !== null) window.clearTimeout(resetTimer.current)
    }
  }, [])

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), 6000)
    return () => window.clearTimeout(timer)
  }, [toast])

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
    if (!markdown) return
    const previous = markdown
    setMarkdown('')
    setCopyState('idle')
    setToast({
      message: 'Editor cleared.',
      actionLabel: 'Undo',
      onAction: () => {
        setMarkdown(previous)
        setGeneration((value) => value + 1)
      },
    })
  }, [markdown])

  const handleCopy = useCallback(async () => {
    const target = previewRef.current
    if (!target || !hasContent) return

    const ok = await copyRichText(target, pasteTarget)
    setCopyState(ok ? 'copied' : 'error')
    setAnnouncement(
      ok
        ? 'Formatted text copied to the clipboard.'
        : 'Copying failed. Select the preview and copy manually.',
    )
    scheduleReset()
  }, [hasContent, pasteTarget, scheduleReset])

  const handlePrint = useCallback(() => {
    if (!hasContent) return
    setPrintOpen(true)
  }, [hasContent])

  const handleConfirmPrint = useCallback((settings: PrintSettings) => {
    setPrintSettings(settings)
    savePrintSettings(settings)
    applyPrintSettings(settings)
    setPrintOpen(false)
    // Let the injected @page rule land before the print dialog is built.
    window.setTimeout(() => window.print(), 120)
  }, [])

  const loadFile = useCallback(async (file: File) => {
    try {
      const text = await readDroppedFile(file)
      setMarkdown(text)
      setGeneration((value) => value + 1)
      setToast({ message: `Loaded ${file.name}` })
    } catch (error) {
      setToast({
        message: error instanceof Error ? error.message : 'That file could not be read.',
      })
    }
  }, [])

  const handleOpen = useCallback(() => fileInputRef.current?.click(), [])

  const handleFileInput = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (file) void loadFile(file)
      event.target.value = ''
    },
    [loadFile],
  )

  const handleSave = useCallback(() => {
    if (!hasContent) return
    downloadMarkdown(markdown)
    setToast({ message: 'Markdown downloaded.' })
  }, [hasContent, markdown])

  const handlePasteTarget = useCallback((target: PasteTarget) => {
    setPasteTarget(target)
    savePasteTarget(target)
  }, [])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const mod = event.metaKey || event.ctrlKey
      if (!mod) return

      if (event.key === 'Enter') {
        event.preventDefault()
        void handleCopy()
      } else if (event.key.toLowerCase() === 'k') {
        event.preventDefault()
        document.getElementById('markdown-input')?.focus()
      } else if (event.key.toLowerCase() === 's') {
        event.preventDefault()
        handleSave()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [handleCopy, handleSave])

  return (
    <div className="app-root app-surface relative flex min-h-[100dvh] flex-col text-ink lg:h-[100dvh] lg:overflow-hidden">
      <a
        href="#markdown-input"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-lg focus:bg-panel focus:px-3 focus:py-2 focus:text-[12.5px] focus:text-ink"
      >
        Skip to editor
      </a>

      <Header
        hasContent={hasContent}
        copyState={copyState}
        theme={theme}
        onSample={handleSample}
        onClear={handleClear}
        onToggleTheme={() => setTheme((value) => (value === 'dark' ? 'light' : 'dark'))}
        onCopy={handleCopy}
        onPrint={handlePrint}
        onOpen={handleOpen}
        onSave={handleSave}
      />

      <main className="relative z-10 flex min-h-0 flex-1 flex-col px-6 py-5 sm:px-8">
        <div className="workspace mx-auto grid h-full w-full max-w-[1180px] grid-cols-1 gap-6 sm:gap-8 lg:min-h-0 lg:grid-cols-2">
          <EditorPane
            value={markdown}
            onChange={setMarkdown}
            charCount={charCount}
            wordCount={wordCount}
            onFileDrop={loadFile}
          />
          <PreviewPane
            markdown={markdown}
            hasContent={hasContent}
            generation={generation}
            contentRef={previewRef}
            pasteTarget={pasteTarget}
            onPasteTargetChange={handlePasteTarget}
          />
        </div>
      </main>

      <footer className="no-print relative z-10 flex shrink-0 items-center justify-center px-6 py-3 text-[11px] tracking-[0.01em] text-faint sm:px-8">
        <span>© SA7 FormatKeeper. All rights reserved.</span>
      </footer>

      <p role="status" aria-live="polite" className="sr-only">
        {announcement}
      </p>

      <Toast toast={toast} onDismiss={() => setToast(null)} />

      <PrintDialog
        open={printOpen}
        settings={printSettings}
        onCancel={() => setPrintOpen(false)}
        onPrint={handleConfirmPrint}
      />

      <input
        ref={fileInputRef}
        type="file"
        accept=".md,.markdown,.txt,text/markdown,text/plain"
        className="hidden"
        onChange={handleFileInput}
        aria-hidden="true"
        tabIndex={-1}
      />
    </div>
  )
}
