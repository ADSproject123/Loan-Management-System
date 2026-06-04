'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { UserX, X } from 'lucide-react'
import { denyMember } from '@/app/actions/admin'
import { showError, showSuccess } from '@/lib/toast'

type DenyMemberButtonProps = {
  memberId: string
  memberName?: string
  label?: string
  className?: string
}

export function DenyMemberButton({
  memberId,
  memberName,
  label = 'បដិសេធ',
  className = '',
}: DenyMemberButtonProps) {
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
    formData.set('id', memberId)
    formData.set('reason', reason)

    startTransition(async () => {
      const result = await denyMember(formData)
      if (result.success) {
        showSuccess('បានបដិសេធការចុះឈ្មោះដោយជោគជ័យ។')
        close()
        router.refresh()
        return
      }
      showError(result.error ?? 'មិនអាចបដិសេធសមាជិកបានទេ។')
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
          aria-labelledby="deny-dialog-title"
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
              <UserX className="h-6 w-6 text-red-600" />
            </div>

            <h2 id="deny-dialog-title" className="pr-8 text-lg font-bold text-gray-900">
              បដិសេធការចុះឈ្មោះ{memberName ? ` — ${memberName}` : ''}
            </h2>
            <p className="mt-2 text-sm leading-6 text-gray-600">
              ការចុះឈ្មោះនឹងត្រូវបានបដិសេធ ហើយសមាជិកនឹងឃើញមូលហេតុនៅលើទំព័រស្ថានភាពគណនី។
            </p>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div>
                <label htmlFor="deny-reason" className="mb-1.5 block text-sm font-semibold text-gray-800">
                  មូលហេតុបដិសេធ <span className="text-red-600">*</span>
                </label>
                <textarea
                  id="deny-reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={4}
                  required
                  minLength={5}
                  disabled={pending}
                  placeholder="ពិពណ៌នាមូលហេតុដែលការចុះឈ្មោះត្រូវបានបដិសេធ..."
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
                  {pending ? 'កំពុងបដិសេធ...' : 'បញ្ជាក់បដិសេធ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
