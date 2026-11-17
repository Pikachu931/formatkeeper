import { Component, type ReactNode } from 'react'

type Props = { children: ReactNode; source: string }
type State = { failed: boolean }

/**
 * A parser or highlighter exception used to blank the whole preview. Rendering
 * the raw source keeps the document readable and copyable instead.
 */
export class PreviewErrorBoundary extends Component<Props, State> {
  state: State = { failed: false }

  static getDerivedStateFromError(): State {
    return { failed: true }
  }

  componentDidCatch(error: unknown): void {
    console.error('Preview render failed', error)
  }

  render() {
    if (!this.state.failed) return this.props.children

    return (
      <div className="space-y-3">
        <p className="text-[12.5px] leading-relaxed text-muted">
          This document could not be rendered as formatted text. The raw Markdown is shown
          below, and the editor still holds the original.
        </p>
        <pre className="keeper-scroll overflow-x-auto rounded-lg border border-line bg-code-bg p-3 font-mono text-[12px] leading-relaxed whitespace-pre-wrap text-ink">
          {this.props.source}
        </pre>
      </div>
    )
  }
}
