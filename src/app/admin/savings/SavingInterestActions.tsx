'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, XCircle, type LucideIcon } from 'lucide-react'
import { updateSavingInterestStatus } from '@/app/actions/admin'
import { AdminActionsMenu, AdminActionsMenuItem } from '@/components/admin'
import { showError, showSuccess } from '@/lib/toast'
import type { SavingInterestPaymentStatus } from '@/types/database'

const STATUS_ACTIONS: {
  status: Exclude<SavingInterestPaymentStatus, 'pending'>
  label: string
  icon: LucideIcon
  destructive?: boolean
}[] = [
  { status: 'completed', label: 'បានបង់', icon: CheckCircle2 },
  { status: 'rejected', label: 'បដិសេធ', icon: XCircle, destructive: true },
]

export function SavingInterestActions({
  memberId,
  periodYear,
  periodMonth,
  amount,
  currency,
  interestDate,
  status,
}: {
  memberId: string
  periodYear: number
  periodMonth: number
  amount: number
  currency: string
  interestDate: string
  status: SavingInterestPaymentStatus
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  function handleStatusChange(next: Exclude<SavingInterestPaymentStatus, 'pending'>) {
    if (next === status || pending) return

    const formData = new FormData()
    formData.set('member_id', memberId)
    formData.set('year', String(periodYear))
    formData.set('month', String(periodMonth))
    formData.set('amount', String(amount))
    formData.set('currency', currency)
    formData.set('interest_date', interestDate)
    formData.set('status', next)

    startTransition(async () => {
      const result = await updateSavingInterestStatus(formData)
      if (result.success) {
        showSuccess('បានប្តូរស្ថានភាពដោយជោគជ័យ។')
        router.refresh()
        return
      }
      showError(result.error ?? 'មិនអាចប្តូរស្ថានភាពបានទេ។')
    })
  }

  const availableActions = STATUS_ACTIONS.filter((action) => action.status !== status)

  return (
    <AdminActionsMenu>
      {availableActions.map((action) => (
        <AdminActionsMenuItem
          key={action.status}
          icon={action.icon}
          label={action.label}
          destructive={action.destructive}
          disabled={pending}
          onClick={() => handleStatusChange(action.status)}
        />
      ))}
    </AdminActionsMenu>
  )
}
