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
  completed: 'text-foreground',
}

export const LOAN_DUE_STATUS_LABELS = REPAYMENT_PAID_LABELS
export const LOAN_DUE_STATUS_STYLES = REPAYMENT_PAID_STYLES
