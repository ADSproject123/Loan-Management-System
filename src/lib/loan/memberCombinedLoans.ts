import {
  annotateLoanPaymentSchedule,
  buildLoanPaymentSchedule,
  loanRepaymentSummary,
  resolveLoanInterestRate,
  type LoanScheduleRow,
} from '@/lib/interestCalculations'
import type { LoanDuePaymentStatus } from '@/types/database'
import type { LoanDueThisMonthRow } from '@/lib/admin/loanRepaymentDue'

export type MemberLoanSourceRow = {
  id: string
  member_id: string
  amount: number | null
  currency: string | null
  term_months: number | null
  monthly_interest_rate: number | null
  start_date: string | null
  disbursed_at: string | null
  created_at: string
  purpose?: string | null
  due_date?: string | null
  status?: string
}

export type LoanRepaymentSourceRow = {
  loan_id: string
  amount: number | null
  status: string
}

export type MemberLoanSnapshot = {
  loanId: string
  principal: number
  paid: number
  pending: number
  totalOwed: number
  remaining: number
  monthlyPayment: number
  rate: number
  scheduleStart: string | null
  schedule: LoanScheduleRow[]
  currency: string
  purpose: string
  dueDate: string | null
}

export type MemberCombinedLoansContext = {
  memberId: string
  loanIds: string[]
  loanCount: number
  totalPrincipal: number
  totalPaid: number
  totalPending: number
  totalOwed: number
  totalRemaining: number
  combinedMonthlyPayment: number
  currency: string
  purposeLabel: string
  earliestDueDate: string | null
  loans: MemberLoanSnapshot[]
  paymentSchedule: LoanScheduleRow[]
}

export type CombinedLoanDueThisMonthRow = {
  memberId: string
  memberName: string
  memberSearchText: string
  memberPhone: string | null
  loanIds: string[]
  primaryLoanId: string
  loanCount: number
  month: number
  dueDate: string | null
  dueAmount: number
  dueInterest: number
  currency: string
  periodYear: number
  periodMonth: number
  status: LoanDuePaymentStatus
  isOverdue: boolean
  breakdown: {
    loanId: string
    scheduleMonth: number
    dueAmount: number
    dueInterest: number
    dueDate: string | null
  }[]
}

function toNumber(value: unknown) {
  const parsed = Number(value ?? 0)
  return Number.isFinite(parsed) ? parsed : 0
}

function scheduleStartForLoan(loan: MemberLoanSourceRow) {
  return (
    loan.disbursed_at?.slice(0, 10) ??
    loan.start_date?.slice(0, 10) ??
    loan.created_at?.slice(0, 10) ??
    null
  )
}

function repaymentsForLoan(loanId: string, repayments: LoanRepaymentSourceRow[]) {
  return repayments.filter((row) => row.loan_id === loanId)
}

export function buildMemberLoanSnapshot(
  loan: MemberLoanSourceRow,
  repayments: LoanRepaymentSourceRow[],
  fallbackLoanRate: number,
  referenceDate: Date | string = new Date()
): MemberLoanSnapshot | null {
  const principal = toNumber(loan.amount)
  const termMonths = toNumber(loan.term_months)
  if (principal <= 0 || termMonths <= 0) return null

  const loanRepayments = repaymentsForLoan(loan.id, repayments)
  const paid = loanRepayments
    .filter((row) => row.status === 'verified' || row.status === 'completed')
    .reduce((sum, row) => sum + toNumber(row.amount), 0)
  const pending = loanRepayments
    .filter((row) => row.status === 'pending')
    .reduce((sum, row) => sum + toNumber(row.amount), 0)

  const rate = resolveLoanInterestRate(loan, fallbackLoanRate)
  const summary = loanRepaymentSummary(principal, termMonths, rate)
  const scheduleStart = scheduleStartForLoan(loan)
  const schedule = annotateLoanPaymentSchedule(
    buildLoanPaymentSchedule(principal, termMonths, rate, scheduleStart),
    paid,
    typeof referenceDate === 'string' ? new Date(`${referenceDate.slice(0, 10)}T12:00:00.000Z`) : referenceDate,
    pending
  )

  const totalOwed = summary.totalRepayment
  const remaining = Math.max(totalOwed - paid, 0)

  return {
    loanId: loan.id,
    principal,
    paid,
    pending,
    totalOwed,
    remaining,
    monthlyPayment: summary.monthlyPayment,
    rate,
    scheduleStart,
    schedule,
    currency: loan.currency ?? 'USD',
    purpose: loan.purpose?.trim() || 'កម្ជីសកម្ម',
    dueDate: loan.due_date?.slice(0, 10) ?? schedule.at(-1)?.dueDate ?? null,
  }
}

function mergeScheduleRows(loans: MemberLoanSnapshot[]): LoanScheduleRow[] {
  const byDueDate = new Map<string, LoanScheduleRow>()

  for (const loan of loans) {
    for (const row of loan.schedule) {
      const key = row.dueDate ?? `month-${row.month}`
      const existing = byDueDate.get(key)
      if (!existing) {
        byDueDate.set(key, { ...row })
        continue
      }

      existing.amount += row.amount
      existing.principalPortion += row.principalPortion
      existing.interestPortion += row.interestPortion
      existing.paidAmount += row.paidAmount
      existing.pendingAmount += row.pendingAmount
      existing.remainingBalance += row.remainingBalance

      if (existing.status !== row.status) {
        if (existing.status === 'paid' || row.status === 'paid') {
          existing.status = existing.status === 'paid' && row.status === 'paid' ? 'paid' : 'partial'
        } else if (existing.status === 'overdue' || row.status === 'overdue') {
          existing.status = 'overdue'
        } else if (existing.status === 'partial' || row.status === 'partial') {
          existing.status = 'partial'
        }
      }
    }
  }

  return Array.from(byDueDate.values()).sort((a, b) => {
    const aTime = a.dueDate ? new Date(a.dueDate).getTime() : a.month
    const bTime = b.dueDate ? new Date(b.dueDate).getTime() : b.month
    return aTime - bTime
  })
}

export function buildMemberCombinedLoansContext(
  memberId: string,
  loans: MemberLoanSourceRow[],
  repayments: LoanRepaymentSourceRow[],
  fallbackLoanRate: number,
  referenceDate: Date | string = new Date()
): MemberCombinedLoansContext | null {
  const activeLoans = loans
    .filter((loan) => loan.member_id === memberId && loan.status === 'active')
    .sort((a, b) => a.created_at.localeCompare(b.created_at))

  const snapshots = activeLoans
    .map((loan) => buildMemberLoanSnapshot(loan, repayments, fallbackLoanRate, referenceDate))
    .filter((snapshot): snapshot is MemberLoanSnapshot => snapshot !== null)

  if (snapshots.length === 0) return null

  const loanIds = snapshots.map((snapshot) => snapshot.loanId)
  const totalPrincipal = snapshots.reduce((sum, snapshot) => sum + snapshot.principal, 0)
  const totalPaid = snapshots.reduce((sum, snapshot) => sum + snapshot.paid, 0)
  const totalPending = snapshots.reduce((sum, snapshot) => sum + snapshot.pending, 0)
  const totalOwed = snapshots.reduce((sum, snapshot) => sum + snapshot.totalOwed, 0)
  const totalRemaining = snapshots.reduce((sum, snapshot) => sum + snapshot.remaining, 0)
  const combinedMonthlyPayment = snapshots.reduce((sum, snapshot) => {
    const nextDue = snapshot.schedule.find(
      (row) => row.status !== 'paid' && row.amount - row.paidAmount - row.pendingAmount > 0.01
    )
    return sum + (nextDue ? Math.max(nextDue.amount - nextDue.paidAmount - nextDue.pendingAmount, 0) : 0)
  }, 0)

  const dueDates = snapshots
    .map((snapshot) => snapshot.dueDate)
    .filter((value): value is string => Boolean(value))
    .sort()

  return {
    memberId,
    loanIds,
    loanCount: snapshots.length,
    totalPrincipal,
    totalPaid,
    totalPending,
    totalOwed,
    totalRemaining,
    combinedMonthlyPayment,
    currency: snapshots[0]?.currency ?? 'USD',
    purposeLabel:
      snapshots.length === 1
        ? snapshots[0].purpose
        : `${snapshots.length} កម្ជីសកម្ម · សរុប ${totalPrincipal.toLocaleString('en-US')}`,
    earliestDueDate: dueDates[0] ?? null,
    loans: snapshots,
    paymentSchedule: mergeScheduleRows(snapshots),
  }
}

function normalizeCombinedDueStatus(statuses: LoanDuePaymentStatus[]): LoanDuePaymentStatus {
  if (statuses.every((status) => status === 'completed')) return 'completed'
  return 'pending'
}

export function aggregateLoanDueRowsByMember(rows: LoanDueThisMonthRow[]): CombinedLoanDueThisMonthRow[] {
  const byMember = new Map<string, LoanDueThisMonthRow[]>()

  for (const row of rows) {
    const list = byMember.get(row.memberId) ?? []
    list.push(row)
    byMember.set(row.memberId, list)
  }

  const combined: CombinedLoanDueThisMonthRow[] = []

  for (const [memberId, memberRows] of byMember) {
    const sorted = [...memberRows].sort((a, b) => {
      const aTime = a.dueDate ? new Date(a.dueDate).getTime() : Number.MAX_SAFE_INTEGER
      const bTime = b.dueDate ? new Date(b.dueDate).getTime() : Number.MAX_SAFE_INTEGER
      return aTime - bTime
    })
    const first = sorted[0]
    const dueAmount = sorted.reduce((sum, row) => sum + row.dueAmount, 0)
    const dueInterest = sorted.reduce((sum, row) => sum + row.dueInterest, 0)
    const statuses = sorted.map((row) => row.status)
    const status = normalizeCombinedDueStatus(statuses)
    const isOverdue = sorted.some((row) => row.isOverdue)

    combined.push({
      memberId,
      memberName: first.memberName,
      memberSearchText: first.memberSearchText,
      memberPhone: first.memberPhone,
      loanIds: sorted.map((row) => row.loanId),
      primaryLoanId: first.loanId,
      loanCount: sorted.length,
      month: first.month,
      dueDate: first.dueDate,
      dueAmount,
      dueInterest,
      currency: first.currency,
      periodYear: first.periodYear,
      periodMonth: first.periodMonth,
      status,
      isOverdue,
      breakdown: sorted.map((row) => ({
        loanId: row.loanId,
        scheduleMonth: row.month,
        dueAmount: row.dueAmount,
        dueInterest: row.dueInterest,
        dueDate: row.dueDate,
      })),
    })
  }

  return combined.sort((a, b) => {
    const aTime = a.dueDate ? new Date(a.dueDate).getTime() : Number.MAX_SAFE_INTEGER
    const bTime = b.dueDate ? new Date(b.dueDate).getTime() : Number.MAX_SAFE_INTEGER
    return aTime - bTime
  })
}

export function allocateRepaymentAcrossLoans(
  amount: number,
  loans: MemberLoanSourceRow[],
  repayments: LoanRepaymentSourceRow[],
  fallbackLoanRate: number
) {
  const ordered = loans
    .filter((loan) => loan.status === 'active')
    .sort((a, b) => a.created_at.localeCompare(b.created_at))

  let remainingPayment = amount
  const allocations: { loanId: string; amount: number }[] = []

  for (const loan of ordered) {
    if (remainingPayment <= 0) break
    const snapshot = buildMemberLoanSnapshot(loan, repayments, fallbackLoanRate)
    if (!snapshot || snapshot.remaining <= 0) continue

    const slice = Math.min(remainingPayment, snapshot.remaining)
    allocations.push({ loanId: loan.id, amount: slice })
    remainingPayment -= slice
  }

  return {
    allocations,
    unallocated: remainingPayment,
  }
}
