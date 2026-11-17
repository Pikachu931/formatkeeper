import { Feather, ScrollText } from 'lucide-react'
import { lazy, memo, Suspense, useEffect } from 'react'
import type { PasteTarget } from '../lib/clipboard'
import { PreviewErrorBoundary } from './PreviewErrorBoundary'

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
  pasteTarget: PasteTarget
  onPasteTargetChange: (target: PasteTarget) => void
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

export const PreviewPane = memo(function PreviewPane({
  markdown,
  hasContent,
  generation,
  contentRef,
  pasteTarget,
  onPasteTargetChange,
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
      className="preview-pane premium-panel flex min-h-[46vh] min-w-0 flex-col overflow-hidden lg:min-h-0"
    >
      <div className="no-print flex shrink-0 items-start justify-between gap-3 px-5 pt-4 pb-3 sm:px-6">
        <div className="min-w-0 flex-1">
          <h2 className="display-face text-[21px] leading-none text-ink">Preview</h2>
          <div className="pane-divider mt-3.5" aria-hidden="true" />
        </div>

        <label className="mt-0.5 shrink-0">
          <span className="sr-only">Paste target</span>
          <select
            value={pasteTarget}
            onChange={(event) => onPasteTargetChange(event.target.value as PasteTarget)}
            title="Choose which editor the copied HTML is optimized for"
            className="rounded-md border border-line bg-panel-soft px-2 py-1 text-[11px] text-muted transition-colors hover:text-ink focus-visible:ring-1 focus-visible:ring-accent/60 focus-visible:outline-none"
          >
            <option value="auto">Auto</option>
            <option value="docs">Google Docs</option>
            <option value="word">Word</option>
            <option value="notion">Notion</option>
          </select>
        </label>
      </div>

      <div className="preview-scroll keeper-scroll relative min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto">
        {hasContent ? (
          <div
            key={`${generation}-${hasContent}`}
            className="preview-body keeper-fade min-w-0 max-w-full px-5 py-5 sm:px-6 sm:py-6"
          >
            <Suspense fallback={<PreviewSkeleton />}>
              <PreviewErrorBoundary key={`${generation}-${markdown.length}`} source={markdown}>
                <MarkdownView markdown={markdown} contentRef={contentRef} />
              </PreviewErrorBoundary>
            </Suspense>
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
