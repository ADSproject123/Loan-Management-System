'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, X } from 'lucide-react'
import type { ActionResult } from '@/app/actions/member'
import { showError, showSuccess } from '@/lib/toast'

type AdminReasonDialogButtonProps = {
  action: (formData: FormData) => Promise<ActionResult>
  id: string
  label: string
  dialogTitle: string
  dialogDescription: string
  reasonLabel: string
  reasonPlaceholder: string
  confirmLabel?: string
  successMessage?: string
  extraFields?: Record<string, string>
  className?: string
}

export function AdminReasonDialogButton({
  action,
  id,
  label,
  dialogTitle,
  dialogDescription,
  reasonLabel,
  reasonPlaceholder,
  confirmLabel,
  successMessage = 'បានធ្វើបច្ចុប្នភាពដោយជោគជ័យ។',
  extraFields,
  className = '',
}: AdminReasonDialogButtonProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [pending, startTransition] = useTransition()

  function close() {
    if (pending) return
    setOpen(false)
    setReason('')
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const formData = new FormData()
    formData.set('id', id)
    formData.set('reason', reason)
    if (extraFields) {
      for (const [key, value] of Object.entries(extraFields)) {
        formData.set(key, value)
      }
    }

    startTransition(async () => {
      const result = await action(formData)
      if (result.success) {
        showSuccess(successMessage)
        close()
        router.refresh()
        return
      }
      showError(result.error ?? 'មានបញ្ហាកើតឡើង។ សូមព្យាយាមម្តងទៀត។')
    })
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 transition-colors hover:bg-red-50 disabled:opacity-60 ${className}`}
      >
        {label}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/50"
            aria-label="បិទ"
            onClick={close}
          />
          <div className="relative w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 text-left shadow-xl">
            <button
              type="button"
              onClick={close}
              disabled={pending}
              className="absolute right-4 top-4 rounded-lg p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
              aria-label="បិទ"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-red-100">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>

            <h2 className="pr-8 text-lg font-bold text-gray-900">{dialogTitle}</h2>
            <p className="mt-2 text-sm leading-6 text-gray-600">{dialogDescription}</p>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div>
                <label htmlFor={`reason-${id}`} className="mb-1.5 block text-sm font-semibold text-gray-800">
                  {reasonLabel} <span className="text-red-600">*</span>
                </label>
                <textarea
                  id={`reason-${id}`}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={4}
                  required
                  minLength={5}
                  disabled={pending}
                  placeholder={reasonPlaceholder}
                  className="w-full resize-y rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:opacity-60"
                />
                <p className="mt-1 text-xs text-gray-500">យ៉ាងតិច ៥ តួអក្សរ</p>
              </div>

              <div className="flex flex-wrap justify-end gap-2">
                <button
                  type="button"
                  onClick={close}
                  disabled={pending}
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-60"
                >
                  បោះបង់
                </button>
                <button
                  type="submit"
                  disabled={pending || reason.trim().length < 5}
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
                >
                  {pending ? 'កំពុងដំណើរការ...' : (confirmLabel ?? label)}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
