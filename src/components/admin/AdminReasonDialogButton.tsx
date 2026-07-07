'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, type LucideIcon } from 'lucide-react'
import type { ActionResult } from '@/app/actions/member'
import { adminMenuItemClass } from '@/components/admin/AdminActionsMenu'
import { AdminMenuItemIcon } from '@/components/admin/AdminActionsMenu'
import {
  AdminModal,
  adminDialogFooterClass,
  adminDialogLabelClass,
} from '@/components/admin/AdminModal'
import { adminFieldClassName } from '@/components/admin/AdminListToolbar'
import { Button } from '@/components/ui/Button'
import { showError, showSuccess } from '@/lib/toast'

const textareaClass = `${adminFieldClassName} min-h-[104px] resize-y px-3 py-2.5`

type AdminReasonDialogButtonProps = {
  action: (formData: FormData) => Promise<ActionResult>
  id: string
  label: string
  dialogTitle: string
  dialogDescription: string
  reasonLabel: string
  reasonPlaceholder: string
  confirmLabel?: string
  pendingLabel?: string
  successMessage?: string
  extraFields?: Record<string, string>
  className?: string
  menuItem?: boolean
  icon?: LucideIcon
  dialogIcon?: LucideIcon
  destructive?: boolean
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
  pendingLabel = 'កំពុងដំណើរការ...',
  successMessage = 'បានធ្វើបច្ចុប្នភាពដោយជោគជ័យ។',
  extraFields,
  className = '',
  menuItem = false,
  icon,
  dialogIcon: DialogIcon = AlertTriangle,
  destructive = true,
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
        disabled={pending}
        className={
          menuItem
            ? `${adminMenuItemClass(destructive)} ${className}`
            : `rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 transition-colors hover:bg-red-50 disabled:opacity-60 ${className}`
        }
      >
        {menuItem && icon ? <AdminMenuItemIcon icon={icon} destructive={destructive} /> : null}
        <span>{label}</span>
      </button>

      <AdminModal
        open={open}
        onClose={close}
        title={dialogTitle}
        description={dialogDescription}
        icon={DialogIcon}
        iconTone="rose"
        pending={pending}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor={`reason-${id}`} className={adminDialogLabelClass}>
              {reasonLabel} <span className="text-red-500">*</span>
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
              className={textareaClass}
            />
            <p className="mt-1.5 text-xs text-muted">យ៉ាងតិច ៥ តួអក្សរ</p>
          </div>

          <div className={adminDialogFooterClass}>
            <Button type="button" variant="outline" size="sm" onClick={close} disabled={pending}>
              បោះបង់
            </Button>
            <Button
              type="submit"
              variant="danger"
              size="sm"
              loading={pending}
              disabled={reason.trim().length < 5}
            >
              {pending ? pendingLabel : (confirmLabel ?? label)}
            </Button>
          </div>
        </form>
      </AdminModal>
    </>
  )
}
