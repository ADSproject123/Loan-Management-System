import {
  annotateLoanPaymentSchedule,
  buildLoanPaymentSchedule,
  resolveLoanInterestRate,
} from '@/lib/interestCalculations'
import { monthsUntilDueDate, todayIso } from '@/lib/dates'

export type LoanScheduleMeta = {
  nextDueDate: string | null
  monthsLeft: number | null
  monthsOverdue: number
}

type LoanScheduleInput = {
  id: string
  status: string
  amount: number | null
  term_months?: number | null
  monthly_interest_rate?: number | null
  start_date?: string | null
  disbursed_at?: string | null
  created_at: string
  due_date?: string | null
}

type RepaymentRow = {
  loan_id: string
  amount: number | null
  status: string
}

function isSchedulableLoan(status: string) {
  return status === 'active' || status === 'approved'
}

export function computeLoanScheduleMeta(
  loan: LoanScheduleInput,
  repayments: RepaymentRow[],
  fallbackLoanRate: number,
  asOfDate = todayIso()
): LoanScheduleMeta {
  if (!isSchedulableLoan(loan.status)) {
    const monthsLeft = loan.due_date ? monthsUntilDueDate(loan.due_date, asOfDate) : null
    return {
      nextDueDate: loan.due_date ?? null,
      monthsLeft: monthsLeft != null && monthsLeft >= 0 ? monthsLeft : null,
      monthsOverdue: monthsLeft != null && monthsLeft < 0 ? Math.abs(monthsLeft) : 0,
    }
  }

  const principal = Number(loan.amount ?? 0)
  const termMonths = loan.term_months ?? 0
  if (principal <= 0 || termMonths <= 0) {
    return { nextDueDate: loan.due_date ?? null, monthsLeft: null, monthsOverdue: 0 }
  }

  const loanRepayments = repayments.filter((row) => row.loan_id === loan.id)
  const paid = loanRepayments
    .filter((row) => row.status === 'verified' || row.status === 'completed')
    .reduce((sum, row) => sum + Number(row.amount ?? 0), 0)
  const pending = loanRepayments
    .filter((row) => row.status === 'pending')
    .reduce((sum, row) => sum + Number(row.amount ?? 0), 0)

  const scheduleStart =
    loan.disbursed_at?.slice(0, 10) ??
    loan.start_date ??
    loan.created_at.slice(0, 10)

  const rate = resolveLoanInterestRate(loan, fallbackLoanRate)
  const schedule = annotateLoanPaymentSchedule(
    buildLoanPaymentSchedule(principal, termMonths, rate, scheduleStart),
    paid,
    new Date(`${asOfDate}T12:00:00.000Z`),
    pending
  )

  let monthsOverdue = 0
  let nextDueDate: string | null = null

  for (const row of schedule) {
    const remaining = row.amount - row.paidAmount - row.pendingAmount
    if (remaining <= 0.01) continue

    if (row.dueDate && row.dueDate < asOfDate) {
      monthsOverdue += 1
      continue
    }

    if (!nextDueDate && row.dueDate) {
      nextDueDate = row.dueDate
      break
    }
  }

  const finalDueDate = schedule.at(-1)?.dueDate ?? loan.due_date ?? null
  const displayDueDate = nextDueDate ?? finalDueDate
  const monthsLeft = displayDueDate ? monthsUntilDueDate(displayDueDate, asOfDate) : null

  return {
    nextDueDate: displayDueDate,
    monthsLeft: monthsLeft != null && monthsLeft >= 0 ? monthsLeft : null,
    monthsOverdue,
  }
}

export function enrichLoansWithScheduleMeta<T extends LoanScheduleInput>(
  loans: T[],
  repayments: RepaymentRow[],
  fallbackLoanRate: number,
  asOfDate = todayIso()
): (T & LoanScheduleMeta)[] {
  return loans.map((loan) => ({
    ...loan,
    ...computeLoanScheduleMeta(loan, repayments, fallbackLoanRate, asOfDate),
  }))
}
