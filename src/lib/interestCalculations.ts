export const DEFAULT_SAVING_INTEREST_RATE = 3
export const DEFAULT_LOAN_INTEREST_RATE = 2

export function monthlySavingInterest(balance: number, ratePercent: number) {
  const rate = Number.isFinite(ratePercent) ? ratePercent : DEFAULT_SAVING_INTEREST_RATE
  return balance * (rate / 100)
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
  savings: { saving_date: string }[],
  today = new Date()
): Date | null {
  if (savings.length === 0) return null
  return savings.reduce<Date | null>((earliest, s) => {
    const d = nextInterestDateForSaving(s.saving_date, today)
    return earliest === null || d < earliest ? d : earliest
  }, null)
}

/** Total saving interest accrued across all savings up to today. */
export function accruedSavingInterestTotal(
  savings: { amount: number; saving_date: string }[],
  ratePercent: number,
  today = new Date()
): number {
  const rate = Number.isFinite(ratePercent) ? ratePercent : DEFAULT_SAVING_INTEREST_RATE
  return savings.reduce((sum, s) => {
    const months = monthsAccrued(s.saving_date, today)
    return sum + s.amount * (rate / 100) * months
  }, 0)
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
  const date = new Date(isoDate)
  date.setMonth(date.getMonth() + monthsAhead)
  return date.toISOString().slice(0, 10)
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

