import type { LoanDuePaymentStatus } from '@/types/database'

export type RepaymentPaidStatus = LoanDuePaymentStatus

export function normalizeRepaymentPaidStatus(status: string | undefined): RepaymentPaidStatus {
  if (status === 'completed' || status === 'verified') return 'completed'
  return 'pending'
}

export function isRepaymentPaid(status: string | undefined) {
  return normalizeRepaymentPaidStatus(status) === 'completed'
}

export const REPAYMENT_PAID_LABELS: Record<RepaymentPaidStatus, string> = {
  pending: 'មិនទាន់បង់',
  completed: 'បានបង់',
}

export const REPAYMENT_PAID_STYLES: Record<RepaymentPaidStatus, string> = {
  pending: 'text-muted',
  completed: 'font-bold text-green-700',
}

export const LOAN_DUE_STATUS_LABELS = REPAYMENT_PAID_LABELS
export const LOAN_DUE_STATUS_STYLES = REPAYMENT_PAID_STYLES

export function loanDueStatusDisplay(row: {
  status: RepaymentPaidStatus
  isOverdue: boolean
}) {
  if (row.isOverdue) {
    return { label: 'ហួសកំណត់', className: 'font-bold text-red-700' }
  }

  return {
    label: REPAYMENT_PAID_LABELS[row.status],
    className: REPAYMENT_PAID_STYLES[row.status],
  }
}
