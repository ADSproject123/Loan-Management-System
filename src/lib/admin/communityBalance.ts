import {
  accruedSavingInterestTotal,
  annotateLoanPaymentSchedule,
  buildLoanPaymentSchedule,
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

  return loans.reduce((total, loan) => {
    const principal = Number(loan.amount ?? 0)
    if (principal <= 0) return total

    const paidSoFar = paidByLoan[loan.id] ?? 0
    if (paidSoFar <= 0) return total + principal

    const scheduleStart =
      loan.disbursed_at?.slice(0, 10) ?? loan.start_date?.slice(0, 10) ?? null
    const rate = resolveLoanInterestRate(loan, fallbackLoanRate)
    const schedule = buildLoanPaymentSchedule(
      principal,
      loan.term_months ?? 12,
      rate,
      scheduleStart
    )
    const annotated = annotateLoanPaymentSchedule(schedule, paidSoFar)

    const remaining = annotated.reduce((sum, row) => {
      if (row.status === 'paid') return sum
      const principalPaid = Math.max(0, row.paidAmount - row.interestPortion)
      return sum + Math.max(row.principalPortion - principalPaid, 0)
    }, 0)

    return total + remaining
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
