import { resolveMonthKeys, type MonthRangeOptions } from '@/lib/admin/savingsChartData'
import {
  buildSavingInterestDueRowsForMonth,
  type VerifiedSavingInterestRow,
} from '@/lib/admin/savingInterestDue'
import {
  buildLoanDueRowsForMonth,
  type ActiveLoanDueRow,
  type LoanRepaymentAmountRow,
} from '@/lib/admin/loanRepaymentDue'

const KHMER_MONTHS = [
  'មករា',
  'កុម្ភៈ',
  'មីនា',
  'មេសា',
  'ឧសភា',
  'មិថុនា',
  'កក្កដា',
  'សីហា',
  'កញ្ញា',
  'តុលា',
  'វិច្ឆិកា',
  'ធ្នូ',
]

export type MonthlyInterestChartPoint = {
  key: string
  label: string
  amount: number
}

function monthLabelFromKey(key: string) {
  const [year, month] = key.split('-')
  const monthIndex = Number(month) - 1
  if (!year || monthIndex < 0 || monthIndex > 11) return key
  return `${KHMER_MONTHS[monthIndex]} ${year}`
}

function parseMonthKey(key: string) {
  const [year, month] = key.split('-').map(Number)
  if (!year || !month || month < 1 || month > 12) return null
  return { year, month }
}

export function buildMonthlySavingInterestChartData(
  savings: VerifiedSavingInterestRow[],
  ratePercent: number,
  options?: MonthRangeOptions,
  asOfDate: string = new Date().toISOString().slice(0, 10)
): MonthlyInterestChartPoint[] {
  const keys = resolveMonthKeys(options)

  return keys.map((key) => {
    const parts = parseMonthKey(key)
    if (!parts) return { key, label: monthLabelFromKey(key), amount: 0 }

    const rows = buildSavingInterestDueRowsForMonth(
      savings,
      ratePercent,
      parts.year,
      parts.month,
      asOfDate
    )
    const amount = rows.reduce((sum, row) => sum + row.interestDue, 0)

    return {
      key,
      label: monthLabelFromKey(key),
      amount,
    }
  })
}

export function buildMonthlyLoanInterestChartData(
  loans: ActiveLoanDueRow[],
  repayments: LoanRepaymentAmountRow[],
  fallbackLoanRate: number,
  options?: MonthRangeOptions,
  asOfDate: string = new Date().toISOString().slice(0, 10)
): MonthlyInterestChartPoint[] {
  const keys = resolveMonthKeys(options)

  return keys.map((key) => {
    const parts = parseMonthKey(key)
    if (!parts) return { key, label: monthLabelFromKey(key), amount: 0 }

    const rows = buildLoanDueRowsForMonth(
      loans,
      repayments,
      fallbackLoanRate,
      parts.year,
      parts.month,
      asOfDate
    )
    const amount = rows.reduce((sum, row) => sum + row.dueInterest, 0)

    return {
      key,
      label: monthLabelFromKey(key),
      amount,
    }
  })
}
