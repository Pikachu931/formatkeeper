import { X } from 'lucide-react'

export type ToastState = {
  message: string
  actionLabel?: string
  onAction?: () => void
} | null

type ToastProps = {
  toast: ToastState
  onDismiss: () => void
}

/** Single-slot toast used for undo and for file/print feedback. */
export function Toast({ toast, onDismiss }: ToastProps) {
  if (!toast) return null

  return (
    <div className="no-print pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4">
      <div
        role="status"
        aria-live="polite"
        className="premium-panel pointer-events-auto flex items-center gap-3 rounded-xl px-4 py-2.5 text-[12.5px] text-ink"
      >
        <span>{toast.message}</span>
        {toast.actionLabel && toast.onAction ? (
          <button
            type="button"
            onClick={() => {
              toast.onAction?.()
              onDismiss()
            }}
            className="rounded-md px-2 py-1 font-medium text-accent-strong transition-colors hover:bg-panel-soft"
          >
            {toast.actionLabel}
          </button>
        ) : null}
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss notification"
          className="text-faint transition-colors hover:text-ink"
        >
          <X className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}
