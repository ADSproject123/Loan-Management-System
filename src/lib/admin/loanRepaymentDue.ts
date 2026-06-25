import {
  annotateLoanPaymentSchedule,
  buildLoanPaymentSchedule,
  resolveLoanInterestRate,
} from '@/lib/interestCalculations'
import { memberKhmerName, memberSearchText } from '@/lib/memberNames'
import type { LoanDuePaymentStatus } from '@/types/database'

export type LoanDueThisMonthRow = {
  loanId: string
  memberId: string
  memberName: string
  memberSearchText: string
  memberPhone: string | null
  month: number
  dueDate: string | null
  dueAmount: number
  dueInterest: number
  currency: string
  periodYear: number
  periodMonth: number
  status: LoanDuePaymentStatus
  isOverdue: boolean
}

export type LoanDuePaymentRow = {
  id: string
  loan_id: string
  period_year: number
  period_month: number
  status: string
}

export type ActiveLoanDueRow = {
  id: string
  member_id: string
  amount: number | null
  currency: string | null
  term_months: number | null
  monthly_interest_rate: number | null
  start_date: string | null
  disbursed_at: string | null
  created_at: string
  members?:
    | {
        full_name?: string | null
        full_name_kh?: string | null
        full_name_en?: string | null
        phone?: string | null
      }
    | {
        full_name?: string | null
        full_name_kh?: string | null
        full_name_en?: string | null
        phone?: string | null
      }[]
    | null
}

export type LoanRepaymentAmountRow = {
  loan_id: string
  amount: number | null
  status: string
}

type ActiveLoanRow = ActiveLoanDueRow

type RepaymentAmountRow = LoanRepaymentAmountRow

function datePartsFromIso(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim())
  if (!match) return null
  return { year: Number(match[1]), month: Number(match[2]) }
}

function toReferenceIso(referenceDate: Date | string) {
  return typeof referenceDate === 'string'
    ? referenceDate.slice(0, 10)
    : referenceDate.toISOString().slice(0, 10)
}

function toReferenceDate(referenceDate: Date | string) {
  return typeof referenceDate === 'string'
    ? new Date(`${referenceDate.slice(0, 10)}T12:00:00.000Z`)
    : referenceDate
}

export function isDueInYearMonth(dueDate: string | null, year: number, month: number) {
  if (!dueDate) return false
  const dueParts = datePartsFromIso(dueDate)
  if (!dueParts) return false
  return dueParts.year === year && dueParts.month === month
}

export function isDueInMonth(dueDate: string | null, referenceDate: Date | string) {
  const refParts = datePartsFromIso(toReferenceIso(referenceDate))
  if (!refParts) return false
  return isDueInYearMonth(dueDate, refParts.year, refParts.month)
}

function memberDisplayName(
  members: ActiveLoanRow['members']
): { name: string; searchText: string; phone: string | null } {
  const member = Array.isArray(members) ? members[0] : members
  return {
    name: memberKhmerName(member),
    searchText: memberSearchText(member),
    phone: member?.phone ?? null,
  }
}

function normalizeLoanDuePaymentStatus(status: string | undefined): LoanDuePaymentStatus {
  if (status === 'completed' || status === 'verified') return 'completed'
  return 'pending'
}

export function buildLoanDueRowsForMonth(
  loans: ActiveLoanDueRow[],
  repayments: LoanRepaymentAmountRow[],
  fallbackLoanRate: number,
  year: number,
  month: number,
  asOfDate: Date | string = new Date(),
  duePayments: LoanDuePaymentRow[] = []
): LoanDueThisMonthRow[] {
  const asOf = toReferenceIso(asOfDate)
  const reference = toReferenceDate(asOfDate)
  const paymentsByLoan = duePayments.reduce<Record<string, LoanDuePaymentRow>>((acc, row) => {
    if (row.period_year === year && row.period_month === month) {
      acc[row.loan_id] = row
    }
    return acc
  }, {})
  const repaymentsByLoan = repayments.reduce<Record<string, RepaymentAmountRow[]>>((acc, row) => {
    if (!acc[row.loan_id]) acc[row.loan_id] = []
    acc[row.loan_id].push(row)
    return acc
  }, {})

  const rows: LoanDueThisMonthRow[] = []

  for (const loan of loans) {
    const principal = Number(loan.amount ?? 0)
    const termMonths = loan.term_months ?? 0
    if (principal <= 0 || termMonths <= 0) continue

    const loanRepayments = repaymentsByLoan[loan.id] ?? []
    const paid = loanRepayments
      .filter((row) => row.status === 'verified' || row.status === 'completed')
      .reduce((sum, row) => sum + Number(row.amount ?? 0), 0)
    const pending = loanRepayments
      .filter((row) => row.status === 'pending')
      .reduce((sum, row) => sum + Number(row.amount ?? 0), 0)

    const scheduleStart =
      loan.disbursed_at?.slice(0, 10) ??
      loan.start_date ??
      loan.created_at?.slice(0, 10) ??
      null
    const rate = resolveLoanInterestRate(loan, fallbackLoanRate)
    const schedule = annotateLoanPaymentSchedule(
      buildLoanPaymentSchedule(principal, termMonths, rate, scheduleStart),
      paid,
      reference,
      pending
    )

    const dueRow = schedule.find((row) => {
      const remaining = row.amount - row.paidAmount - row.pendingAmount
      if (remaining <= 0.01) return false
      return isDueInYearMonth(row.dueDate, year, month)
    })

    if (!dueRow) continue

    const dueAmount = Math.max(dueRow.amount - dueRow.paidAmount - dueRow.pendingAmount, 0)
    if (dueAmount <= 0.01) continue

    const dueInterest =
      dueRow.amount > 0.01 ? dueRow.interestPortion * (dueAmount / dueRow.amount) : 0

    const { name, searchText, phone } = memberDisplayName(loan.members)
    const payment = paymentsByLoan[loan.id]
    const status = normalizeLoanDuePaymentStatus(payment?.status)
    const dueDate = dueRow.dueDate ?? ''
    const isOverdue = status === 'pending' && dueDate !== '' && dueDate < asOf

    rows.push({
      loanId: loan.id,
      memberId: loan.member_id,
      memberName: name,
      memberSearchText: searchText,
      memberPhone: phone,
      month: dueRow.month,
      dueDate: dueRow.dueDate,
      dueAmount,
      dueInterest,
      currency: loan.currency ?? 'USD',
      periodYear: year,
      periodMonth: month,
      status,
      isOverdue,
    })
  }

  return rows.sort((a, b) => {
    const aTime = a.dueDate ? new Date(a.dueDate).getTime() : Number.MAX_SAFE_INTEGER
    const bTime = b.dueDate ? new Date(b.dueDate).getTime() : Number.MAX_SAFE_INTEGER
    return aTime - bTime
  })
}

/** @deprecated Use buildLoanDueRowsForMonth */
export function buildLoanDueThisMonthRows(
  loans: ActiveLoanDueRow[],
  repayments: LoanRepaymentAmountRow[],
  fallbackLoanRate: number,
  referenceDate: Date | string = new Date()
) {
  const refParts = datePartsFromIso(toReferenceIso(referenceDate))
  if (!refParts) return []
  return buildLoanDueRowsForMonth(
    loans,
    repayments,
    fallbackLoanRate,
    refParts.year,
    refParts.month,
    referenceDate
  )
}
