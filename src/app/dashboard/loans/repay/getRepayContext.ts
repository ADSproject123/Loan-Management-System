import 'server-only'

import { requireMember } from '@/lib/auth/member'
import { createAdminClient } from '@/lib/supabase/admin'
import { getInterestSettings } from '@/lib/interest'
import type { LoanScheduleRow } from '@/lib/interestCalculations'
import { buildMemberCombinedLoansContext } from '@/lib/loan/memberCombinedLoans'
import type { CurrencyCode } from '@/lib/currency'

export type RepayContext = {
  memberId: string
  loanIds: string[]
  loanCount: number
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

  const [loansResult, repaymentsResult, interestSettings] = await Promise.all([
    admin
      .from('loans')
      .select(
        'id, member_id, amount, currency, purpose, term_months, monthly_interest_rate, start_date, disbursed_at, due_date, status, created_at'
      )
      .eq('member_id', member.id)
      .eq('status', 'active')
      .order('created_at', { ascending: true }),
    admin.from('loan_repayments').select('loan_id, amount, status').eq('member_id', member.id),
    getInterestSettings(),
  ])

  const loans = loansResult.data ?? []
  if (loans.length === 0) return null

  const combined = buildMemberCombinedLoansContext(
    member.id,
    loans,
    repaymentsResult.data ?? [],
    interestSettings.monthlyLoanInterestRate
  )

  if (!combined) return null

  const primaryLoan = combined.loans[0]
  const totalTermMonths = combined.loans.reduce((max, snapshot) => {
    return Math.max(max, snapshot.schedule.length)
  }, 0)

  return {
    memberId: member.id,
    loanIds: combined.loanIds,
    loanCount: combined.loanCount,
    loan: {
      id: primaryLoan.loanId,
      amount: combined.totalPrincipal,
      currency: combined.currency as CurrencyCode,
      purpose: combined.purposeLabel,
      term_months: totalTermMonths,
      due_date: combined.earliestDueDate,
    },
    paid: combined.totalPaid,
    remaining: combined.totalRemaining,
    totalOwed: combined.totalOwed,
    monthlyPayment: Math.round(combined.combinedMonthlyPayment),
    paymentSchedule: combined.paymentSchedule.map((row, index) => ({
      ...row,
      month: index + 1,
    })),
  }
}
