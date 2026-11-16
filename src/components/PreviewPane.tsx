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
      className="preview-pane flex min-h-[46vh] min-w-0 flex-col overflow-hidden rounded-xl border border-line bg-panel lg:min-h-0"
    >
      <div className="no-print flex shrink-0 items-center gap-2 border-b border-line px-4 py-2">
        <Eye className="h-[13px] w-[13px] text-faint" aria-hidden="true" />
        <h2 className="text-[12.5px] font-medium text-muted">Preview</h2>
      </div>

      <div className="preview-scroll keeper-scroll relative min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto">
        {hasContent ? (
          <div
            key={`${generation}-${hasContent}`}
            className="preview-body keeper-fade min-w-0 max-w-full px-4 py-5 sm:px-6 sm:py-6"
          >
            <Suspense fallback={<PreviewSkeleton />}>
              <MarkdownView markdown={markdown} contentRef={contentRef} />
            </Suspense>
          </div>
        ) : (
          <div className="preview-empty keeper-fade flex h-full min-h-[220px] flex-col items-center justify-center px-6 py-10 text-center">
            <FileText className="h-5 w-5 text-faint" aria-hidden="true" />
            <p className="mt-3 text-[13px] text-muted">
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
