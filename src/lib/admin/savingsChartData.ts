import { addMonths, format, startOfMonth, subMonths } from 'date-fns'

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

export type SavingChartSourceRow = {
  amount: number | null
  currency: string | null
  status: string
  verified_at: string | null
  verified_by: string | null
  saving_date: string | null
  created_at: string
}

export type MonthlySavingsChartPoint = {
  key: string
  label: string
  amount: number
}

export function isVerifiedSavingForChart(row: SavingChartSourceRow) {
  return (
    row.status === 'verified' ||
    row.status === 'completed' ||
    Boolean(row.verified_at || row.verified_by)
  )
}

function monthLabelFromKey(key: string) {
  const [year, month] = key.split('-')
  const monthIndex = Number(month) - 1
  if (!year || monthIndex < 0 || monthIndex > 11) return key
  return `${KHMER_MONTHS[monthIndex]} ${year}`
}

export type MonthRangeOptions = {
  monthsBack?: number
  fromKey?: string
  toKey?: string
}

function keyToDate(key: string) {
  const [year, month] = key.split('-').map(Number)
  if (!year || !month || month < 1 || month > 12) return null
  return new Date(year, month - 1, 1)
}

export function resolveMonthKeys(options?: MonthRangeOptions): string[] {
  const fromDate = options?.fromKey ? keyToDate(options.fromKey) : null
  const toDate = options?.toKey ? keyToDate(options.toKey) : null

  if (fromDate && toDate) {
    const start = startOfMonth(fromDate <= toDate ? fromDate : toDate)
    const end = startOfMonth(fromDate <= toDate ? toDate : fromDate)
    const keys: string[] = []
    let cursor = start
    while (cursor <= end && keys.length < 120) {
      keys.push(format(cursor, 'yyyy-MM'))
      cursor = addMonths(cursor, 1)
    }
    return keys
  }

  const monthsBack = options?.monthsBack ?? 12
  const anchor = startOfMonth(new Date())
  const keys: string[] = []
  for (let i = monthsBack - 1; i >= 0; i--) {
    keys.push(format(subMonths(anchor, i), 'yyyy-MM'))
  }
  return keys
}

export function buildMonthlySavingsChartData(
  rows: SavingChartSourceRow[],
  options?: MonthRangeOptions
): MonthlySavingsChartPoint[] {
  const verified = rows.filter(isVerifiedSavingForChart)
  const buckets = new Map<string, number>(resolveMonthKeys(options).map((key) => [key, 0]))

  for (const row of verified) {
    const dateStr = row.saving_date ?? row.created_at
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
