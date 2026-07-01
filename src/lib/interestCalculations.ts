import { addMonths } from '@/lib/dates'

export const DEFAULT_SAVING_INTEREST_RATE = 3
export const DEFAULT_LOAN_INTEREST_RATE = 2

export function monthlySavingInterest(balance: number, ratePercent: number) {
  const rate = Number.isFinite(ratePercent) ? ratePercent : DEFAULT_SAVING_INTEREST_RATE
  return balance * (rate / 100)
}

export type SavingInterestSource = {
  member_id?: string | null
  amount: number | null | undefined
  saving_date?: string | null
  verified_at?: string | null
  created_at?: string | null
}

export function savingInterestStartDate(saving: SavingInterestSource): string | null {
  if (saving.saving_date) return saving.saving_date.slice(0, 10)
  if (saving.verified_at) return saving.verified_at.slice(0, 10)
  if (saving.created_at) return saving.created_at.slice(0, 10)
  return null
}

export function combinedSavingsBalance(savings: SavingInterestSource[]) {
  return savings.reduce((sum, saving) => sum + Number(saving.amount ?? 0), 0)
}

/** Monthly interest on the member's combined verified savings balance. */
export function monthlySavingInterestForCombinedSavings(
  savings: SavingInterestSource[],
  ratePercent: number
) {
  return monthlySavingInterest(combinedSavingsBalance(savings), ratePercent)
}

type DatedDeposit = {
  saving: SavingInterestSource
  start: string
  amount: number
}

function datedDeposits(savings: SavingInterestSource[]): DatedDeposit[] {
  return savings
    .map((saving) => ({
      saving,
      start: savingInterestStartDate(saving) ?? '',
      amount: Number(saving.amount ?? 0),
    }))
    .filter((row): row is DatedDeposit => Boolean(row.start) && row.amount > 0)
    .sort((a, b) => a.start.localeCompare(b.start))
}

function lastDayOfMonth(year: number, month: number) {
  const day = new Date(year, month, 0).getDate()
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function interestPayDateInMonth(savingDay: number, year: number, month: number) {
  const lastDay = new Date(year, month, 0).getDate()
  const day = Math.min(savingDay, lastDay)
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function combinedBalanceThroughDate(deposits: DatedDeposit[], throughDate: string) {
  return deposits
    .filter((deposit) => deposit.start <= throughDate)
    .reduce((sum, deposit) => sum + deposit.amount, 0)
}

function groupSavingsByMember(savings: SavingInterestSource[]) {
  const byMember = new Map<string, SavingInterestSource[]>()
  for (const saving of savings) {
    const memberId = saving.member_id ?? '__member__'
    const list = byMember.get(memberId) ?? []
    list.push(saving)
    byMember.set(memberId, list)
  }
  return byMember
}

function monthInterestShouldAccrue(
  year: number,
  month: number,
  firstStart: string,
  today = new Date()
) {
  const monthEnd = lastDayOfMonth(year, month)
  if (monthEnd < firstStart) return false

  const payDay = new Date(firstStart).getDate()
  const payDate = interestPayDateInMonth(payDay, year, month)
  const todayIso = today.toISOString().slice(0, 10)
  return payDate <= todayIso
}

export function accruedCombinedSavingInterest(
  savings: SavingInterestSource[],
  ratePercent: number,
  today = new Date()
) {
  const deposits = datedDeposits(savings)
  if (deposits.length === 0) return 0

  const firstStart = deposits[0].start
  const [startYear, startMonth] = firstStart.split('-').map(Number)
  let year = startYear
  let month = startMonth
  const endYear = today.getFullYear()
  const endMonth = today.getMonth() + 1
  let accrued = 0

  while (year < endYear || (year === endYear && month <= endMonth)) {
    if (monthInterestShouldAccrue(year, month, firstStart, today)) {
      const balance = combinedBalanceThroughDate(deposits, lastDayOfMonth(year, month))
      if (balance > 0) {
        accrued += monthlySavingInterest(balance, ratePercent)
      }
    }

    month += 1
    if (month > 12) {
      month = 1
      year += 1
    }
  }

  return accrued
}

/**
 * Full months of interest that have accrued since fromDateStr.
 * The current month counts only once today's date has reached the same
 * day-of-month as the start date (i.e. the monthly "payment day" has arrived).
 */
export function monthsAccrued(fromDateStr: string, today = new Date()): number {
  const from = new Date(fromDateStr)
  const totalMonths =
    (today.getFullYear() - from.getFullYear()) * 12 +
    (today.getMonth() - from.getMonth())
  const dayReached = today.getDate() >= from.getDate()
  return Math.max(0, dayReached ? totalMonths : totalMonths - 1)
}

/**
 * The next calendar date when interest will click over for a given saving.
 * Interest ticks on the same day-of-month as the original saving_date.
 */
function nextInterestDateForSaving(savingDateStr: string, today = new Date()): Date {
  const payDay = new Date(savingDateStr).getDate()
  const next = new Date(today.getFullYear(), today.getMonth(), payDay)
  if (today.getDate() >= payDay) {
    next.setMonth(next.getMonth() + 1)
  }
  return next
}

/**
 * Earliest upcoming interest date across all savings (the soonest day any
 * saving's monthly interest will next click over).
 */
export function nextInterestDate(
  savings: SavingInterestSource[],
  today = new Date()
): Date | null {
  const deposits = datedDeposits(savings)
  if (deposits.length === 0) return null
  return nextInterestDateForSaving(deposits[0].start, today)
}

/** Total saving interest accrued on combined balances (per member), up to today. */
export function accruedSavingInterestTotal(
  savings: SavingInterestSource[],
  ratePercent: number,
  today = new Date()
): number {
  let total = 0
  for (const memberSavings of groupSavingsByMember(savings).values()) {
    total += accruedCombinedSavingInterest(memberSavings, ratePercent, today)
  }
  return total
}

function safePrincipal(principal: number) {
  return Number.isFinite(principal) ? Math.max(principal, 0) : 0
}

function safeTermMonths(termMonths: number) {
  return termMonths > 0 ? Math.floor(termMonths) : 1
}

function safeRatePercent(ratePercent: number) {
  return Number.isFinite(ratePercent) ? Math.max(ratePercent, 0) : DEFAULT_LOAN_INTEREST_RATE
}

export function loanRepaymentSummary(
  principal: number,
  termMonths: number,
  ratePercent: number
) {
  const schedule = buildLoanPaymentSchedule(principal, termMonths, ratePercent)
  const interest = schedule.reduce((sum, row) => sum + row.interestPortion, 0)
  const totalRepayment = schedule.reduce((sum, row) => sum + row.amount, 0)
  // First month has the highest payment (most interest); use it as the reference.
  const monthlyPayment = schedule[0]?.amount ?? 0

  return { interest, totalRepayment, monthlyPayment }
}

export type LoanScheduleEntry = {
  month: number
  dueDate: string | null
  principalPortion: number
  interestPortion: number
  amount: number
  remainingBalance: number
}

export type LoanScheduleStatus = 'paid' | 'partial' | 'pending' | 'overdue'

export type LoanScheduleRow = LoanScheduleEntry & {
  paidAmount: number
  pendingAmount: number
  status: LoanScheduleStatus
}

function addMonthsToDate(isoDate: string, monthsAhead: number) {
  return addMonths(isoDate, monthsAhead)
}

export function buildLoanPaymentSchedule(
  principal: number,
  termMonths: number,
  ratePercent: number,
  scheduleStartDate?: string | null
): LoanScheduleEntry[] {
  const amount = safePrincipal(principal)
  const term = safeTermMonths(termMonths)
  const monthlyRate = safeRatePercent(ratePercent) / 100
  // Equal-principal method: same principal paid every month.
  const principalPerMonth = amount / term

  let balance = amount
  const entries: LoanScheduleEntry[] = []

  for (let index = 0; index < term; index += 1) {
    const isLastMonth = index === term - 1
    const principalPortion = isLastMonth ? balance : principalPerMonth
    const interestPortion = monthlyRate === 0 ? 0 : balance * monthlyRate

    balance = Math.max(balance - principalPortion, 0)

    entries.push({
      month: index + 1,
      dueDate: scheduleStartDate ? addMonthsToDate(scheduleStartDate, index + 1) : null,
      principalPortion,
      interestPortion,
      amount: principalPortion + interestPortion,
      remainingBalance: balance,
    })
  }

  return entries
}

export function annotateLoanPaymentSchedule(
  schedule: LoanScheduleEntry[],
  totalPaid = 0,
  referenceDate = new Date(),
  totalPending = 0
): LoanScheduleRow[] {
  let remainingPaid = Math.max(totalPaid, 0)
  let remainingPending = Math.max(totalPending, 0)
  const today = referenceDate.toISOString().slice(0, 10)

  return schedule.map((entry) => {
    const paidAmount = Math.min(remainingPaid, entry.amount)
    remainingPaid = Math.max(remainingPaid - paidAmount, 0)

    const dueAfterPaid = Math.max(entry.amount - paidAmount, 0)
    const pendingAmount = Math.min(remainingPending, dueAfterPaid)
    remainingPending = Math.max(remainingPending - pendingAmount, 0)

    let status: LoanScheduleStatus = 'pending'
    if (paidAmount >= entry.amount - 0.01) {
      status = 'paid'
    } else if (paidAmount > 0) {
      status = 'partial'
    } else if (entry.dueDate && entry.dueDate < today) {
      status = 'overdue'
    }

    return { ...entry, paidAmount, pendingAmount, status }
  })
}

export function loanTotalOwed(principal: number, termMonths: number, ratePercent: number) {
  return loanRepaymentSummary(principal, termMonths, ratePercent).totalRepayment
}

export function resolveLoanInterestRate(
  loan: { monthly_interest_rate?: number | null },
  fallbackRate = DEFAULT_LOAN_INTEREST_RATE
) {
  const stored = Number(loan.monthly_interest_rate)
  if (Number.isFinite(stored) && stored >= 0) return stored
  return fallbackRate
}

