'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, type LucideIcon } from 'lucide-react'
import { deleteMember } from '@/app/actions/admin'
import { adminMenuItemClass, AdminMenuItemIcon } from '@/components/admin/AdminActionsMenu'
import {
  AdminModal,
  adminDialogFooterClass,
} from '@/components/admin/AdminModal'
import { Button } from '@/components/ui/Button'
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
  const [pending, startTransition] = useTransition()

  function close() {
    if (pending) return
    setOpen(false)
  }

  function handleConfirm() {
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
            : `rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 transition-colors hover:bg-red-50 disabled:opacity-60 ${className}`
        }
      >
        {menuItem && icon ? <AdminMenuItemIcon icon={icon} destructive /> : null}
        <span>{label}</span>
      </button>

      <AdminModal
        open={open}
        onClose={close}
        title="លុបគណនី"
        description={`លុបគណនីរបស់ ${memberName} ជាអចិន្ត្រៃយ៍។`}
        icon={Trash2}
        iconTone="rose"
        pending={pending}
      >
        <div className="space-y-4">
          <div className="rounded-xl border border-red-200 bg-red-50/70 px-4 py-3 text-sm leading-relaxed text-red-900">
            <p className="font-semibold">សកម្មភាពនេះមិនអាចត្រឡប់ក្រោយវិញបានទេ។</p>
            <p className="mt-1.5 text-red-800">
              ទិន្នន័យទាំងអស់របស់សមាជិក — ការសន្សំ កម្ជី ការសងប្រាក់ និង គណនីចូល — នឹងត្រូវបានលុបជាអចិន្ត្រៃយ៍។
            </p>
          </div>

          <div className={adminDialogFooterClass}>
            <Button type="button" variant="outline" size="sm" onClick={close} disabled={pending}>
              បោះបង់
            </Button>
            <Button
              type="button"
              variant="danger"
              size="sm"
              loading={pending}
              onClick={handleConfirm}
            >
              {pending ? 'កំពុងលុប...' : 'លុបគណនី'}
            </Button>
          </div>
        </div>
      </AdminModal>
    </>
  )
}
