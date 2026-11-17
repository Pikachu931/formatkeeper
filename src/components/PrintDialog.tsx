import { useEffect, useRef, useState } from 'react'
import type { PrintSettings } from '../lib/storage'

const PAGE_OPTIONS: PrintSettings['pageSize'][] = ['A4', 'Letter']

const MARGIN_OPTIONS: { value: PrintSettings['margin']; label: string }[] = [
  { value: 'narrow', label: 'Narrow · 15 mm' },
  { value: 'normal', label: 'Normal · 25 mm' },
  { value: 'wide', label: 'Wide · 35 mm' },
]

type PrintDialogProps = {
  open: boolean
  settings: PrintSettings
  onCancel: () => void
  onPrint: (settings: PrintSettings) => void
}

type PanelProps = Omit<PrintDialogProps, 'open'>

/** Mounted only while open, so the draft state starts from the saved settings. */
function PrintDialogPanel({ settings, onCancel, onPrint }: PanelProps) {
  const [draft, setDraft] = useState(settings)
  const printRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => printRef.current?.focus())
    return () => window.cancelAnimationFrame(frame)
  }, [])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onCancel])

  return (
    <div
      role="presentation"
      onClick={onCancel}
      className="no-print fixed inset-0 z-50 flex items-center justify-center bg-black/55 px-4 py-8 backdrop-blur-sm"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="print-dialog-title"
        onClick={(event) => event.stopPropagation()}
        className="premium-panel w-full max-w-[27rem] rounded-2xl p-6 text-ink"
      >
        <h2 id="print-dialog-title" className="display-face text-[21px] leading-none text-ink">
          Print / PDF
        </h2>
        <div className="pane-divider mt-3.5" aria-hidden="true" />

        <fieldset className="mt-5">
          <legend className="text-[10.5px] font-medium tracking-[0.15em] text-faint uppercase">
            Paper
          </legend>
          <div className="mt-2 flex gap-2">
            {PAGE_OPTIONS.map((size) => (
              <label
                key={size}
                className={`flex-1 cursor-pointer rounded-lg border px-3 py-2 text-center text-[12.5px] transition-colors ${
                  draft.pageSize === size
                    ? 'border-accent/60 bg-panel-soft text-ink'
                    : 'border-line text-muted hover:text-ink'
                }`}
              >
                <input
                  type="radio"
                  name="keeper-page-size"
                  value={size}
                  checked={draft.pageSize === size}
                  onChange={() => setDraft({ ...draft, pageSize: size })}
                  className="sr-only"
                />
                {size}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="mt-4">
          <legend className="text-[10.5px] font-medium tracking-[0.15em] text-faint uppercase">
            Margins
          </legend>
          <div className="mt-2 grid gap-1.5">
            {MARGIN_OPTIONS.map((option) => (
              <label
                key={option.value}
                className={`flex cursor-pointer items-center justify-between rounded-lg border px-3 py-2 text-[12.5px] transition-colors ${
                  draft.margin === option.value
                    ? 'border-accent/60 bg-panel-soft text-ink'
                    : 'border-line text-muted hover:text-ink'
                }`}
              >
                <span>{option.label}</span>
                <input
                  type="radio"
                  name="keeper-margins"
                  value={option.value}
                  checked={draft.margin === option.value}
                  onChange={() => setDraft({ ...draft, margin: option.value })}
                  className="sr-only"
                />
              </label>
            ))}
          </div>
        </fieldset>

        <p className="mt-4 text-[11.5px] leading-relaxed text-faint">
          Page breaks are chosen by the browser's print dialog. Paper size and margins apply to
          the saved PDF.
        </p>

        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg px-3 py-2 text-[12.5px] text-muted transition-colors hover:bg-panel-soft hover:text-ink"
          >
            Cancel
          </button>
          <button
            ref={printRef}
            type="button"
            onClick={() => onPrint(draft)}
            className="btn-primary rounded-lg px-4 py-2 text-[12.5px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent/60"
          >
            Print / PDF
          </button>
        </div>
      </div>
    </div>
  )
}

export function PrintDialog({ open, settings, onCancel, onPrint }: PrintDialogProps) {
  if (!open) return null
  return <PrintDialogPanel settings={settings} onCancel={onCancel} onPrint={onPrint} />
}
