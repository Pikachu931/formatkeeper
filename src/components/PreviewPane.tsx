import { Eye, FileText } from 'lucide-react'
import { lazy, memo, Suspense, useEffect } from 'react'

// react-markdown, KaTeX and the highlighter only matter once there is content,
// so they are split into their own chunk instead of blocking first paint.
const loadMarkdownView = () => import('./MarkdownView')

const MarkdownView = lazy(() =>
  loadMarkdownView().then((module) => ({ default: module.MarkdownView })),
)

type PreviewPaneProps = {
  markdown: string
  hasContent: boolean
  generation: number
  contentRef: React.RefObject<HTMLDivElement | null>
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

export const PreviewPane = memo(function PreviewPane({
  markdown,
  hasContent,
  generation,
  contentRef,
}: PreviewPaneProps) {
  // Warm the parser / KaTeX / highlighter while the page is idle so the first
  // paste renders immediately instead of waiting on the chunk + dev transform.
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
      className="preview-pane flex min-h-[46vh] min-w-0 flex-col overflow-hidden rounded-2xl border border-line bg-panel shadow-[var(--panel-shadow)] lg:min-h-0"
    >
      <div className="no-print flex shrink-0 items-center justify-between gap-3 border-b border-line bg-panel-soft/70 px-3.5 py-2.5 sm:px-4">
        <div className="flex items-center gap-2">
          <Eye className="h-[13px] w-[13px] text-accent-strong" aria-hidden="true" />
          <h2 className="text-[10.5px] font-semibold tracking-[0.16em] text-muted uppercase">
            Preview
          </h2>
        </div>
        {hasContent ? (
          <span className="flex items-center gap-1.5 text-[10.5px] font-medium tracking-wide text-faint uppercase">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/60" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
            </span>
            Live
          </span>
        ) : (
          <span className="text-[10.5px] tracking-wide text-faint uppercase">Rich text</span>
        )}
      </div>

      <div className="preview-scroll keeper-scroll relative min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto">
        {hasContent ? (
          <div
            key={`${generation}-${hasContent}`}
            className="preview-body keeper-fade min-w-0 max-w-full px-3.5 py-4 sm:px-5 sm:py-5"
          >
            <Suspense fallback={<PreviewSkeleton />}>
              <MarkdownView markdown={markdown} contentRef={contentRef} />
            </Suspense>
          </div>
        ) : (
          <div className="preview-empty keeper-fade flex h-full min-h-[220px] flex-col items-center justify-center px-6 py-10 text-center">
            <div className="grid h-12 w-12 place-items-center rounded-2xl border border-line bg-panel-soft shadow-[var(--panel-shadow)]">
              <FileText className="h-5 w-5 text-faint" aria-hidden="true" />
            </div>
            <p className="mt-4 text-[13px] font-medium text-muted">
              Your formatted preview will appear here
            </p>
            <p className="mt-1.5 max-w-[17rem] text-[11.5px] leading-relaxed text-faint">
              Paste on the left, or load the sample to see tables, code blocks and equations
              render live.
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
