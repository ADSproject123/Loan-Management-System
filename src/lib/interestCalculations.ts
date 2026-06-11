export const DEFAULT_SAVING_INTEREST_RATE = 3
export const DEFAULT_LOAN_INTEREST_RATE = 2

export function monthlySavingInterest(balance: number, ratePercent: number) {
  const rate = Number.isFinite(ratePercent) ? ratePercent : DEFAULT_SAVING_INTEREST_RATE
  return balance * (rate / 100)
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

/** Equal monthly installment (interest on declining balance each month). */
function amortizedMonthlyPayment(principal: number, termMonths: number, ratePercent: number) {
  const amount = safePrincipal(principal)
  const term = safeTermMonths(termMonths)
  const monthlyRate = safeRatePercent(ratePercent) / 100

  if (amount === 0) return 0
  if (monthlyRate === 0) return amount / term

  const growth = Math.pow(1 + monthlyRate, term)
  return (amount * monthlyRate * growth) / (growth - 1)
}

export function loanRepaymentSummary(
  principal: number,
  termMonths: number,
  ratePercent: number
) {
  const schedule = buildLoanPaymentSchedule(principal, termMonths, ratePercent)
  const interest = schedule.reduce((sum, row) => sum + row.interestPortion, 0)
  const totalRepayment = schedule.reduce((sum, row) => sum + row.amount, 0)
  const monthlyPayment = schedule[0]?.amount ?? amortizedMonthlyPayment(principal, termMonths, ratePercent)

  return { interest, totalRepayment, monthlyPayment }
}

export type LoanScheduleEntry = {
  month: number
  dueDate: string | null
  principalPortion: number
  interestPortion: number
  amount: number
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
  const installment = amortizedMonthlyPayment(amount, term, ratePercent)

  let balance = amount
  const entries: LoanScheduleEntry[] = []

  for (let index = 0; index < term; index += 1) {
    const isLastMonth = index === term - 1
    const interestPortion = monthlyRate === 0 ? 0 : balance * monthlyRate
    let principalPortion = isLastMonth ? balance : installment - interestPortion
    principalPortion = Math.min(Math.max(principalPortion, 0), balance)

    entries.push({
      month: index + 1,
      dueDate: scheduleStartDate ? addMonthsToDate(scheduleStartDate, index + 1) : null,
      principalPortion,
      interestPortion,
      amount: principalPortion + interestPortion,
    })

    balance = Math.max(balance - principalPortion, 0)
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

