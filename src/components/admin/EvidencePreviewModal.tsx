'use client'

import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

type EvidencePreviewModalProps = {
  url: string | null
  onClose: () => void
  title?: string
}

export function EvidencePreviewModal({
  url,
  onClose,
  title = 'ភស្តុតាង',
}: EvidencePreviewModalProps) {
  if (!url || typeof document === 'undefined') return null

  const isPdf = /\.pdf($|\?)/i.test(url)

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3.5">
          <p className="text-sm font-semibold text-slate-800">{title}</p>
          <button
            type="button"
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="បិទ"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {isPdf ? (
          <div className="flex flex-col items-center gap-4 p-8 text-center">
            <p className="text-sm text-slate-600">មិនអាចបង្ហាញ PDF នៅក្នុងផ្ទាំងនេះ</p>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg bg-brand-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-800"
            >
              បើក PDF
            </a>
          </div>
        ) : (
          <div className="overflow-auto">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt={title} className="block max-h-[80vh] w-full object-contain" />
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}

type EvidencePreviewButtonProps = {
  onClick: () => void
  label?: string
}

export function EvidencePreviewButton({
  onClick,
  label = 'មើលភស្តុតាង',
}: EvidencePreviewButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center rounded-lg border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-800 transition hover:bg-brand-100"
    >
      {label}
    </button>
  )
}
