import {
  accruedSavingInterestTotal,
  loanRemainingAfterPayments,
  loanScheduleStartDate,
  resolveLoanInterestRate,
} from '@/lib/interestCalculations'
import { isVerifiedSavingForChart, type SavingChartSourceRow } from '@/lib/admin/savingsChartData'

export type CommunityLoanBalanceRow = {
  id: string
  amount: number | null
  term_months: number | null
  monthly_interest_rate: number | null
  start_date: string | null
  disbursed_at: string | null
  created_at?: string | null
}

export type CommunityRepaymentRow = {
  loan_id: string
  amount: number | null
  status: string
}

export function computeLoanRemainingBalance(
  loans: CommunityLoanBalanceRow[],
  repayments: CommunityRepaymentRow[],
  fallbackLoanRate: number
) {
  if (loans.length === 0) return 0

  const paidByLoan = repayments.reduce<Record<string, number>>((acc, row) => {
    if (row.status !== 'verified' && row.status !== 'completed') return acc
    acc[row.loan_id] = (acc[row.loan_id] ?? 0) + Number(row.amount ?? 0)
    return acc
  }, {})

  const pendingByLoan = repayments.reduce<Record<string, number>>((acc, row) => {
    if (row.status !== 'pending') return acc
    acc[row.loan_id] = (acc[row.loan_id] ?? 0) + Number(row.amount ?? 0)
    return acc
  }, {})

  return loans.reduce((total, loan) => {
    const principal = Number(loan.amount ?? 0)
    if (principal <= 0) return total

    const paidSoFar = paidByLoan[loan.id] ?? 0
    const pendingSoFar = pendingByLoan[loan.id] ?? 0
    const rate = resolveLoanInterestRate(loan, fallbackLoanRate)

    return (
      total +
      loanRemainingAfterPayments(
        principal,
        loan.term_months ?? 12,
        rate,
        loanScheduleStartDate(loan),
        paidSoFar,
        pendingSoFar
      )
    )
  }, 0)
}

export function computeCommunityBalance(
  savings: SavingChartSourceRow[],
  loans: CommunityLoanBalanceRow[],
  repayments: CommunityRepaymentRow[],
  monthlySavingInterestRate: number,
  monthlyLoanInterestRate: number
) {
  const verifiedSavings = savings.filter(isVerifiedSavingForChart)
  const savingsTotal = verifiedSavings.reduce((sum, row) => sum + Number(row.amount ?? 0), 0)
  const accruedInterest = accruedSavingInterestTotal(
    verifiedSavings.map((row) => ({
      member_id: row.member_id,
      amount: Number(row.amount ?? 0),
      saving_date: row.saving_date,
      verified_at: row.verified_at,
      created_at: row.created_at,
    })),
    monthlySavingInterestRate
  )
  const loanRemaining = computeLoanRemainingBalance(loans, repayments, monthlyLoanInterestRate)
  const netTotal = savingsTotal + accruedInterest - loanRemaining

  return {
    savingsTotal,
    accruedInterest,
    loanRemaining,
    netTotal,
  }
}
