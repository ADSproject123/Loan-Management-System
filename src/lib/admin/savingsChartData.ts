import { format, startOfMonth, subMonths } from 'date-fns'
import { normalizeCurrency } from '@/lib/currency'

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
  usd: number
  khr: number
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

export function buildMonthlySavingsChartData(
  rows: SavingChartSourceRow[],
  monthsBack = 12
): MonthlySavingsChartPoint[] {
  const verified = rows.filter(isVerifiedSavingForChart)
  const anchor = startOfMonth(new Date())
  const buckets = new Map<string, { usd: number; khr: number }>()

  for (let i = monthsBack - 1; i >= 0; i--) {
    const monthDate = subMonths(anchor, i)
    const key = format(monthDate, 'yyyy-MM')
    buckets.set(key, { usd: 0, khr: 0 })
  }

  for (const row of verified) {
    const dateStr = row.saving_date ?? row.created_at
    const date = new Date(dateStr)
    if (Number.isNaN(date.getTime())) continue

    const key = format(startOfMonth(date), 'yyyy-MM')
    const bucket = buckets.get(key)
    if (!bucket) continue

    const currency = normalizeCurrency(row.currency)
    const amount = Number(row.amount ?? 0)
    if (!Number.isFinite(amount)) continue

    if (currency === 'KHR') bucket.khr += amount
    else bucket.usd += amount
  }

  return Array.from(buckets.entries()).map(([key, totals]) => ({
    key,
    label: monthLabelFromKey(key),
    usd: totals.usd,
    khr: totals.khr,
  }))
}
