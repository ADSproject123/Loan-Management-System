'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, Clock, type LucideIcon } from 'lucide-react'
import { updateRepaymentStatus } from '@/app/actions/admin'
import { AdminActionsMenu, AdminActionsMenuItem } from '@/components/admin'
import { showError, showSuccess } from '@/lib/toast'
import { normalizeRepaymentPaidStatus, type RepaymentPaidStatus } from '@/lib/admin/repaymentStatus'

const STATUS_ACTIONS: {
  status: RepaymentPaidStatus
  label: string
  icon: LucideIcon
}[] = [
  { status: 'pending', label: 'មិនទាន់បង់', icon: Clock },
  { status: 'completed', label: 'បានបង់', icon: CheckCircle2 },
]

export function RepaymentActions({
  repaymentId,
  status,
}: {
  repaymentId: string
  status: string
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const paidStatus = normalizeRepaymentPaidStatus(status)

  function handleStatusChange(next: RepaymentPaidStatus) {
    if (next === paidStatus || pending) return

    const formData = new FormData()
    formData.set('id', repaymentId)
    formData.set('status', next)

    startTransition(async () => {
      const result = await updateRepaymentStatus(formData)
      if (result.success) {
        showSuccess('បានប្តូរស្ថានភាពដោយជោគជ័យ។')
        router.refresh()
        return
      }
      showError(result.error ?? 'មិនអាចប្តូរស្ថានភាពបានទេ។')
    })
  }

  const availableActions = STATUS_ACTIONS.filter((action) => action.status !== paidStatus)

  return (
    <AdminActionsMenu>
      {availableActions.map((action) => (
        <AdminActionsMenuItem
          key={action.status}
          icon={action.icon}
          label={action.label}
          disabled={pending}
          onClick={() => handleStatusChange(action.status)}
        />
      ))}
    </AdminActionsMenu>
  )
}
