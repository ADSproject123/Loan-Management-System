'use client'

import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { formatKhmerDate } from '@/lib/dates'
import { LoanRepayForm, type ActiveLoan } from '@/app/dashboard/loans/repay/LoanRepayForm'

type LoanRepayModalProps = {
  open: boolean
  onClose: () => void
  scheduleMonth: number
  dueDate: string | null
  dueAmount: number
  activeLoan: ActiveLoan
}

export function LoanRepayModal({
  open,
  onClose,
  scheduleMonth,
  dueDate,
  dueAmount,
  activeLoan,
}: LoanRepayModalProps) {
  useEffect(() => {
    if (!open) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  if (!open || typeof document === 'undefined') return null

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="loan-repay-modal-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/50"
        aria-label="បិទ"
        onClick={onClose}
      />
      <div className="relative flex max-h-[min(90vh,900px)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
        <div className="flex shrink-0 items-start justify-between border-b border-gray-100 px-5 py-4">
          <div className="min-w-0 pr-4">
            <h2 id="loan-repay-modal-title" className="text-lg font-bold text-gray-900">
              បង់ប្រាក់ខែ {scheduleMonth}
            </h2>
            <p className="mt-0.5 text-sm text-gray-500">
              កាលបរិច្ឆេទត្រូវបង់ {dueDate ? formatKhmerDate(dueDate) : 'មិនកំណត់'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
            aria-label="បិទ"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="min-h-0 overflow-y-auto px-5 py-4">
          <LoanRepayForm
            activeLoan={activeLoan}
            scheduleMonth={scheduleMonth}
            defaultAmount={dueAmount}
            onComplete={onClose}
          />
        </div>
      </div>
    </div>,
    document.body
  )
}
