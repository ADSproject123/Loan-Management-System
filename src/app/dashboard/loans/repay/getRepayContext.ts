import 'server-only'

import { requireMember } from '@/lib/auth/member'
import { createAdminClient } from '@/lib/supabase/admin'
import { normalizeCurrency, type CurrencyCode } from '@/lib/currency'
import {
  annotateLoanPaymentSchedule,
  buildLoanPaymentSchedule,
  getInterestSettings,
  loanRepaymentSummary,
  resolveLoanInterestRate,
} from '@/lib/interest'
import type { LoanScheduleRow } from '@/lib/interestCalculations'
import { toNumber } from '@/lib/utils'

export type RepayContext = {
  loan: {
    id: string
    amount: number
    currency: CurrencyCode
    purpose: string
    term_months: number
    due_date: string | null
  }
  paid: number
  remaining: number
  totalOwed: number
  monthlyPayment: number
  paymentSchedule: LoanScheduleRow[]
}

export async function getRepayContext(): Promise<RepayContext | null> {
  const member = await requireMember()
  const admin = createAdminClient()

  const [loanResult, repaymentsResult, interestSettings] = await Promise.all([
    admin
      .from('loans')
      .select(
        'id, amount, currency, purpose, term_months, monthly_interest_rate, start_date, disbursed_at, due_date, status, created_at'
      )
      .eq('member_id', member.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
    admin.from('loan_repayments').select('loan_id, amount, status').eq('member_id', member.id),
    getInterestSettings(),
  ])

  const loan = loanResult.data
  if (!loan) return null

  const repayments = repaymentsResult.data ?? []
  const loanRepayments = repayments.filter((repayment) => repayment.loan_id === loan.id)
  const paid = loanRepayments
    .filter((repayment) => repayment.status === 'verified' || repayment.status === 'completed')
    .reduce((sum, repayment) => sum + toNumber(repayment.amount), 0)
  const pending = loanRepayments
    .filter((repayment) => repayment.status === 'pending')
    .reduce((sum, repayment) => sum + toNumber(repayment.amount), 0)

  const amount = toNumber(loan.amount)
  const termMonths = toNumber(loan.term_months) || 12
  const loanRate = resolveLoanInterestRate(loan, interestSettings.monthlyLoanInterestRate)
  const summary = loanRepaymentSummary(amount, termMonths, loanRate)
  const totalOwed = summary.totalRepayment
  const remaining = Math.max(totalOwed - paid, 0)
  const scheduleStart =
    loan.disbursed_at?.slice(0, 10) ?? loan.start_date ?? loan.created_at?.slice(0, 10) ?? null
  const paymentSchedule = annotateLoanPaymentSchedule(
    buildLoanPaymentSchedule(amount, termMonths, loanRate, scheduleStart),
    paid,
    new Date(),
    pending
  )

  return {
    loan: {
      id: loan.id,
      amount,
      currency: normalizeCurrency(loan.currency),
      purpose: loan.purpose ?? '',
      term_months: termMonths,
      due_date: loan.due_date ?? null,
    },
    paid,
    remaining,
    totalOwed,
    monthlyPayment: Math.round(summary.monthlyPayment),
    paymentSchedule,
  }
}
