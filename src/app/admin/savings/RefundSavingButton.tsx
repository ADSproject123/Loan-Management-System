'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, X, type LucideIcon } from 'lucide-react'
import { refundSaving } from '@/app/actions/admin'
import { adminMenuItemClass, AdminMenuItemIcon } from '@/components/admin/AdminActionsMenu'
import { showError, showSuccess } from '@/lib/toast'

type RefundSavingButtonProps = {
  savingId: string
  memberName?: string
  amountLabel?: string
  label?: string
  className?: string
  menuItem?: boolean
  icon?: LucideIcon
}

export function RefundSavingButton({
  savingId,
  memberName,
  amountLabel,
  label = 'សងប្រាក់',
  className = '',
  menuItem = false,
  icon,
}: RefundSavingButtonProps) {
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
    formData.set('id', savingId)
    formData.set('reason', reason)

    startTransition(async () => {
      const result = await refundSaving(formData)
      if (result.success) {
        showSuccess('បានសងប្រាក់វិញដោយជោគជ័យ។')
        close()
        router.refresh()
        return
      }
      showError(result.error ?? 'មិនអាចសងប្រាក់វិញបានទេ។')
    })
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={pending}
        className={
          menuItem
            ? `${adminMenuItemClass(true)} ${className}`
            : `rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-60 ${className}`
        }
      >
        {menuItem && icon ? <AdminMenuItemIcon icon={icon} destructive /> : null}
        <span>{label}</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="refund-saving-dialog-title"
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

            <h2 id="refund-saving-dialog-title" className="pr-8 text-lg font-bold text-gray-900">
              {label}
              {memberName ? ` — ${memberName}` : ''}
            </h2>
            {amountLabel && <p className="mt-1 text-sm font-semibold text-gray-700">{amountLabel}</p>}
            <p className="mt-2 text-sm leading-6 text-gray-600">
              សមាជិកនឹងទទួលបានការជូនដំណឹងជាមួយមូលហេតុ។ ការសន្សំនេះនឹងមិនត្រូវបញ្ចូលទៅសមតុល្យទេ។
            </p>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div>
                <label htmlFor="refund-saving-reason" className="mb-1.5 block text-sm font-semibold text-gray-800">
                  មូលហេតុសងប្រាក់វិញ <span className="text-red-600">*</span>
                </label>
                <textarea
                  id="refund-saving-reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={4}
                  required
                  minLength={5}
                  disabled={pending}
                  placeholder="ឧ. ភស្តុតាងមិនត្រឹមត្រូវ ឬចំនួនទឹកប្រាក់មិនផ្គូផ្គង..."
                  className="w-full resize-y rounded-xl border border-gray-300 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:opacity-60"
                />
                <p className="mt-1 text-xs text-gray-500">យ៉ាងតិច ៥ តួអក្សរ</p>
              </div>

              <div className="flex flex-wrap justify-end gap-2">
                <button
                  type="button"
                  onClick={close}
                  disabled={pending}
                  className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-60"
                >
                  បោះបង់
                </button>
                <button
                  type="submit"
                  disabled={pending || reason.trim().length < 5}
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
                >
                  {pending ? 'កំពុងដំណើរការ...' : `បញ្ជាក់${label}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
