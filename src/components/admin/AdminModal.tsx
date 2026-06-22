'use client'

import { X, type LucideIcon } from 'lucide-react'

type AdminModalProps = {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  icon?: LucideIcon
  iconTone?: 'brand' | 'emerald' | 'default'
  size?: 'md' | 'lg' | 'xl'
  children: React.ReactNode
  pending?: boolean
}

const sizeClass = {
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
} as const

const iconToneClass = {
  brand: 'bg-brand-50 text-brand-700',
  emerald: 'bg-emerald-50 text-emerald-700',
  default: 'bg-surface-muted text-muted',
} as const

export function AdminModal({
  open,
  onClose,
  title,
  description,
  icon: Icon,
  iconTone = 'brand',
  size = 'md',
  children,
  pending = false,
}: AdminModalProps) {
  if (!open) return null

  function handleClose() {
    if (pending) return
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-modal-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/50"
        aria-label="បិទ"
        onClick={handleClose}
      />
      <div
        className={`relative flex max-h-[min(90vh,720px)] w-full flex-col overflow-hidden rounded-2xl border border-border bg-surface text-left shadow-xl ${sizeClass[size]}`}
      >
        <div className="shrink-0 border-b border-border px-6 py-5">
          <button
            type="button"
            onClick={handleClose}
            disabled={pending}
            className="absolute right-4 top-4 rounded-lg p-1 text-muted transition hover:bg-surface-muted hover:text-foreground disabled:opacity-60"
            aria-label="បិទ"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="flex items-start gap-3 pr-8">
            {Icon ? (
              <span
                className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${iconToneClass[iconTone]}`}
              >
                <Icon className="h-5 w-5" />
              </span>
            ) : null}
            <div className="min-w-0">
              <h2 id="admin-modal-title" className="text-lg font-bold text-foreground">
                {title}
              </h2>
              {description ? (
                <p className="mt-1 text-sm leading-relaxed text-muted">{description}</p>
              ) : null}
            </div>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>
  )
}
