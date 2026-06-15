'use client'

import { useState, useTransition } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { Trash2, X, type LucideIcon } from 'lucide-react'
import { deleteMember } from '@/app/actions/admin'
import { adminMenuItemClass, AdminMenuItemIcon } from '@/components/admin/AdminActionsMenu'
import { showError, showSuccess } from '@/lib/toast'

type DeleteMemberButtonProps = {
  memberId: string
  memberName: string
  label?: string
  className?: string
  menuItem?: boolean
  icon?: LucideIcon
  redirectTo?: string
}

export function DeleteMemberButton({
  memberId,
  memberName,
  label = 'លុបគណនី',
  className = '',
  menuItem = false,
  icon,
  redirectTo,
}: DeleteMemberButtonProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [confirmName, setConfirmName] = useState('')
  const [pending, startTransition] = useTransition()

  const nameMatches = confirmName.trim() === memberName.trim()

  function close() {
    if (pending) return
    setOpen(false)
    setConfirmName('')
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nameMatches) return
    const formData = new FormData()
    formData.set('id', memberId)

    startTransition(async () => {
      const result = await deleteMember(formData)
      if (result.success) {
        showSuccess('បានលុបគណនីសមាជិកដោយជោគជ័យ។')
        close()
        if (redirectTo) {
          router.push(redirectTo)
        } else {
          router.refresh()
        }
        return
      }
      showError(result.error ?? 'មិនអាចលុបសមាជិកបានទេ។')
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
            : `rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-60 ${className}`
        }
      >
        {menuItem && icon ? <AdminMenuItemIcon icon={icon} destructive /> : null}
        <span>{label}</span>
      </button>

      {open && createPortal(
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-member-dialog-title"
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
              <Trash2 className="h-6 w-6 text-red-600" />
            </div>

            <h2 id="delete-member-dialog-title" className="pr-8 text-lg font-bold text-gray-900">
              លុបគណនី — {memberName}
            </h2>
            <p className="mt-2 text-sm leading-6 text-gray-600">
              សកម្មភាពនេះ<strong className="text-red-600">មិនអាចត្រឡប់វិញបានទេ</strong>។
              ទិន្នន័យទាំងអស់របស់សមាជិក — ការសន្សំ កម្ជី ការសងប្រាក់ និង គណនីចូល —
              នឹងត្រូវបានលុបជាអចិន្ត្រៃយ៍។
            </p>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div>
                <label htmlFor="delete-confirm-name" className="mb-1.5 block text-sm font-semibold text-gray-800">
                  វាយឈ្មោះ <span className="font-bold text-red-600">{memberName}</span> ដើម្បីបញ្ជាក់
                </label>
                <input
                  id="delete-confirm-name"
                  type="text"
                  value={confirmName}
                  onChange={(e) => setConfirmName(e.target.value)}
                  disabled={pending}
                  autoComplete="off"
                  placeholder={memberName}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-300 focus:border-red-600 focus:outline-none focus:ring-2 focus:ring-red-500/20 disabled:opacity-60"
                />
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
                  disabled={pending || !nameMatches}
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
                >
                  {pending ? 'កំពុងលុប...' : 'លុបជាអចិន្ត្រៃយ៍'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
