'use client'

import { ArrowLeft } from 'lucide-react'

export function HistoryBackButton({ label = 'ត្រឡប់ក្រោយ' }: { label?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.history.back()}
      className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition-colors hover:text-brand-900"
    >
      <ArrowLeft className="h-4 w-4" aria-hidden />
      {label}
    </button>
  )
}
