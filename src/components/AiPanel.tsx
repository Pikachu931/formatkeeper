import { Check, Loader2, X } from 'lucide-react'
import { useEffect, useRef } from 'react'
import type { Analysis, StyleId } from '../lib/analysis'
import { AiDocument } from './AiDocument'

type AiPanelProps = {
  open: boolean
  loading: boolean
  error: string
  analysis: Analysis | null
  selected: StyleId
  onSelect: (styleId: StyleId) => void
  onRetry: () => void
  onClose: () => void
  onGenerate: () => void
}

const ORDER: StyleId[] = ['standard', 'minimalistic', 'gorgeous']

type PanelBodyProps = Omit<AiPanelProps, 'open'>

function AiPanelBody({
  loading,
  error,
  analysis,
  selected,
  onSelect,
  onRetry,
  onClose,
  onGenerate,
}: PanelBodyProps) {
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => closeRef.current?.focus())
    return () => window.cancelAnimationFrame(frame)
  }, [])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      role="presentation"
      onClick={onClose}
      className="no-print fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/55 px-4 py-8 backdrop-blur-sm sm:items-center"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="ai-panel-title"
        onClick={(event) => event.stopPropagation()}
        className="premium-panel w-full max-w-[64rem] rounded-2xl p-5 text-ink sm:p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 id="ai-panel-title" className="display-face text-[22px] leading-none text-ink">
              AI layout suggestions
            </h2>
            {analysis ? (
              <p className="mt-2 truncate text-[12px] text-muted">
                {analysis.title} · {analysis.documentType} · {analysis.tone}
              </p>
            ) : (
              <p className="mt-2 text-[12px] text-muted">
                Reading your document and matching it to three layouts.
              </p>
            )}
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close AI suggestions"
            className="shrink-0 rounded-lg p-2 text-muted transition-colors hover:bg-panel-soft hover:text-ink focus-visible:ring-1 focus-visible:ring-accent/60 focus-visible:outline-none"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="pane-divider mt-3.5" aria-hidden="true" />

        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted">
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
            <p className="text-[12.5px]" role="status" aria-live="polite">
              Analyzing structure, highlights and tone…
            </p>
          </div>
        ) : error ? (
          <div className="py-10 text-center">
            <p
              role="alert"
              className="mx-auto max-w-[34rem] text-[13px] leading-relaxed text-rose-600 dark:text-rose-300"
            >
              {error}
            </p>
            <div className="mt-5 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={onRetry}
                className="btn-primary rounded-lg px-4 py-2 text-[12.5px] font-medium"
              >
                Try again
              </button>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg px-3 py-2 text-[12.5px] text-muted transition-colors hover:bg-panel-soft hover:text-ink"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : analysis ? (
          <>
            <div role="radiogroup" aria-label="PDF layout" className="mt-5 grid gap-3 md:grid-cols-3">
              {ORDER.map((styleId) => {
                const spec = analysis.styles[styleId]
                const active = selected === styleId
                return (
                  <div
                    key={styleId}
                    role="radio"
                    aria-checked={active}
                    tabIndex={0}
                    onClick={() => onSelect(styleId)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        onSelect(styleId)
                      }
                    }}
                    className={`cursor-pointer rounded-xl border p-3 transition-colors focus-visible:ring-1 focus-visible:ring-accent/60 focus-visible:outline-none ${
                      active
                        ? 'border-accent/70 bg-panel-soft'
                        : 'border-line hover:border-line-strong'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="display-face text-[16px] leading-none text-ink">
                        {spec.label}
                      </span>
                      {active ? (
                        <Check className="h-4 w-4 text-accent-strong" aria-hidden="true" />
                      ) : null}
                    </div>

                    <div
                      className="mt-3 h-[190px] overflow-hidden rounded-lg border border-line"
                      style={{ backgroundColor: spec.palette.background }}
                    >
                      <div
                        className="origin-top-left"
                        style={{ transform: 'scale(0.52)', width: '192%' }}
                      >
                        <AiDocument analysis={analysis} styleId={styleId} compact />
                      </div>
                    </div>

                    <p className="mt-3 text-[11.5px] leading-relaxed text-muted">
                      {spec.rationale}
                    </p>
                    <p className="mt-1.5 text-[10.5px] leading-relaxed text-faint">
                      {spec.headingStyle} · {spec.highlightStyle}
                    </p>
                  </div>
                )
              })}
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <p className="max-w-[34rem] text-[11px] leading-relaxed text-faint">
                Generate PDF opens your browser's print dialog; choose "Save as PDF". Multi-page
                content, tables and Bengali text are handled by the browser.
              </p>
              <button
                type="button"
                onClick={onGenerate}
                className="btn-primary rounded-lg px-4 py-2 text-[12.5px] font-medium"
              >
                Generate PDF
              </button>
            </div>
          </>
        ) : null}
      </div>
    </div>
  )
}

export function AiPanel({ open, ...rest }: AiPanelProps) {
  if (!open) return null
  return <AiPanelBody {...rest} />
}
