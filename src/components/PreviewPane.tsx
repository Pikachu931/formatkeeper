import { Feather, ScrollText } from 'lucide-react'
import { lazy, memo, Suspense, useEffect } from 'react'

// react-markdown, KaTeX and the highlighter only matter once there is content,
// so they are split into their own chunk instead of blocking first paint.
const loadMarkdownView = () => import('./MarkdownView')

const MarkdownView = lazy(() =>
  loadMarkdownView().then((module) => ({ default: module.MarkdownView })),
)

export type PreviewMode = 'exact' | 'formatted'

type PreviewPaneProps = {
  markdown: string
  hasContent: boolean
  generation: number
  contentRef: React.RefObject<HTMLDivElement | null>
  previewMode: PreviewMode
  onPreviewModeChange: (mode: PreviewMode) => void
}

/** Scroll and quill, drawn as one ornamental line illustration. */
function ScrollQuill() {
  return (
    <span className="relative inline-flex h-14 w-14 text-muted/85" aria-hidden="true">
      <ScrollText className="h-full w-full" strokeWidth={1} />
      <Feather
        className="absolute -right-2 bottom-0 h-[46%] w-[46%] rotate-[-18deg]"
        strokeWidth={1.15}
      />
    </span>
  )
}

function PreviewSkeleton() {
  return (
    <div className="space-y-2.5 px-1 py-1" aria-hidden="true">
      <div className="h-4 w-2/5 animate-pulse rounded-md bg-panel-soft" />
      <div className="h-2.5 w-full animate-pulse rounded-full bg-panel-soft" />
      <div className="h-2.5 w-11/12 animate-pulse rounded-full bg-panel-soft" />
      <div className="h-2.5 w-4/5 animate-pulse rounded-full bg-panel-soft" />
    </div>
  )
}

const MODES: { id: PreviewMode; label: string; hint: string }[] = [
  { id: 'exact', label: 'Exact', hint: 'Show the text exactly as pasted, spaces and blank lines included' },
  { id: 'formatted', label: 'Formatted', hint: 'Render headings, tables, code and math as markdown' },
]

export const PreviewPane = memo(function PreviewPane({
  markdown,
  hasContent,
  generation,
  contentRef,
  previewMode,
  onPreviewModeChange,
}: PreviewPaneProps) {
  // Warm the parser / KaTeX / highlighter while the page is idle so switching to
  // the formatted view renders immediately instead of waiting on the chunk.
  useEffect(() => {
    const warm = () => {
      void loadMarkdownView()
    }
    const timer = window.setTimeout(warm, 300)
    return () => window.clearTimeout(timer)
  }, [])

  return (
    <section
      aria-label="Formatted preview"
      className="preview-pane premium-panel flex min-h-[46vh] min-w-0 flex-col overflow-hidden lg:min-h-0"
    >
      <div className="no-print flex shrink-0 items-start justify-between gap-3 px-5 pt-4 pb-3 sm:px-6">
        <div className="min-w-0 flex-1">
          <h2 className="display-face text-[21px] leading-none text-ink">Preview</h2>
          <div className="pane-divider mt-3.5" aria-hidden="true" />
        </div>

        <div
          role="group"
          aria-label="Preview whitespace handling"
          className="mt-0.5 flex shrink-0 items-center gap-0.5 rounded-lg border border-line bg-panel-soft p-0.5"
        >
          {MODES.map((mode) => (
            <button
              key={mode.id}
              type="button"
              aria-pressed={previewMode === mode.id}
              title={mode.hint}
              onClick={() => onPreviewModeChange(mode.id)}
              className={`rounded-md px-2 py-1 text-[10.5px] font-medium transition-colors focus-visible:ring-1 focus-visible:ring-accent/60 focus-visible:outline-none ${
                previewMode === mode.id
                  ? 'bg-panel text-ink shadow-[0_1px_2px_rgb(0_0_0/0.08)]'
                  : 'text-muted hover:text-ink'
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </div>

      <div className="preview-scroll keeper-scroll relative min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto">
        {hasContent ? (
          <div
            key={`${generation}-${hasContent}-${previewMode}`}
            className="preview-body keeper-fade min-w-0 max-w-full px-5 py-5 sm:px-6 sm:py-6"
          >
            {previewMode === 'exact' ? (
              <div ref={contentRef} className="md-body">
                <div className="md-exact">{markdown}</div>
              </div>
            ) : (
              <Suspense fallback={<PreviewSkeleton />}>
                <MarkdownView markdown={markdown} contentRef={contentRef} />
              </Suspense>
            )}
          </div>
        ) : (
          <div className="preview-empty keeper-fade flex h-full min-h-[220px] flex-col items-center justify-center px-6 py-10 text-center">
            <ScrollQuill />
            <p className="mt-4 text-[13.5px] text-muted">
              Your formatted preview will appear here
            </p>
          </div>
        )}

        {/* Screen-hidden; the print stylesheet reveals it at the end of the document. */}
        <div className="print-footer hidden">
          <span>FormatKeeper</span>
          <span>© SA7</span>
        </div>
      </div>
    </section>
  )
})
