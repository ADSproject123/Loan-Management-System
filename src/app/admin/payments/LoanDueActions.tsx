'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, Clock, type LucideIcon } from 'lucide-react'
import { updateLoanDueStatus } from '@/app/actions/admin'
import { AdminActionsMenu, AdminActionsMenuItem } from '@/components/admin'
import { showError, showSuccess } from '@/lib/toast'
import type { LoanDuePaymentStatus } from '@/types/database'

const STATUS_ACTIONS: {
  status: LoanDuePaymentStatus
  label: string
  icon: LucideIcon
}[] = [
  { status: 'pending', label: 'មិនទាន់បង់', icon: Clock },
  { status: 'completed', label: 'បានបង់', icon: CheckCircle2 },
]

export function LoanDueActions({
  loanId,
  memberId,
  periodYear,
  periodMonth,
  scheduleMonth,
  amount,
  interestAmount,
  currency,
  dueDate,
  status,
}: {
  loanId: string
  memberId: string
  periodYear: number
  periodMonth: number
  scheduleMonth: number
  amount: number
  interestAmount: number
  currency: string
  dueDate: string
  status: LoanDuePaymentStatus
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  function handleStatusChange(next: LoanDuePaymentStatus) {
    if (next === status || pending) return

    const formData = new FormData()
    formData.set('loan_id', loanId)
    formData.set('member_id', memberId)
    formData.set('year', String(periodYear))
    formData.set('month', String(periodMonth))
    formData.set('schedule_month', String(scheduleMonth))
    formData.set('amount', String(amount))
    formData.set('interest_amount', String(interestAmount))
    formData.set('currency', currency)
    formData.set('due_date', dueDate)
    formData.set('status', next)

    startTransition(async () => {
      const result = await updateLoanDueStatus(formData)
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
          disabled={pending}
          onClick={() => handleStatusChange(action.status)}
        />
      ))}
    </AdminActionsMenu>
  )
}
