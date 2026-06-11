import { format, startOfMonth } from 'date-fns'
import { resolveMonthKeys, type MonthRangeOptions } from '@/lib/admin/savingsChartData'

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

export type LoanChartSourceRow = {
  amount: number | null
  currency: string | null
  status: string
  disbursed_at: string | null
  approved_at: string | null
  start_date: string | null
  created_at: string
}

export type MonthlyLoanChartPoint = {
  key: string
  label: string
  amount: number
}

export function isDisbursedLoanForChart(row: LoanChartSourceRow) {
  return (
    row.status === 'active' ||
    row.status === 'approved' ||
    row.status === 'completed' ||
    Boolean(row.disbursed_at || row.approved_at)
  )
}

function monthLabelFromKey(key: string) {
  const [year, month] = key.split('-')
  const monthIndex = Number(month) - 1
  if (!year || monthIndex < 0 || monthIndex > 11) return key
  return `${KHMER_MONTHS[monthIndex]} ${year}`
}

export function buildMonthlyLoanChartData(
  rows: LoanChartSourceRow[],
  options?: MonthRangeOptions
): MonthlyLoanChartPoint[] {
  const disbursed = rows.filter(isDisbursedLoanForChart)
  const buckets = new Map<string, number>(resolveMonthKeys(options).map((key) => [key, 0]))

  for (const row of disbursed) {
    const dateStr = row.disbursed_at ?? row.approved_at ?? row.start_date ?? row.created_at
    const date = new Date(dateStr)
    if (Number.isNaN(date.getTime())) continue

    const key = format(startOfMonth(date), 'yyyy-MM')
    if (!buckets.has(key)) continue

    const amount = Number(row.amount ?? 0)
    if (!Number.isFinite(amount)) continue

    buckets.set(key, (buckets.get(key) ?? 0) + amount)
  }

  return Array.from(buckets.entries()).map(([key, amount]) => ({
    key,
    label: monthLabelFromKey(key),
    amount,
  }))
}
