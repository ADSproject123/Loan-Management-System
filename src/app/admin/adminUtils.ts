import { formatMoney, normalizeCurrency, type CurrencyCode } from '@/lib/currency'
import type { AdminCurrencyTotals } from '@/components/admin/types'

export function money(value: unknown, currency: CurrencyCode = 'USD') {
  return formatMoney(value, currency)
}

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

export function formatDate(value?: string | null) {
  if (!value) return 'មិនកំណត់'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'មិនកំណត់'
  // Format manually with a fixed Khmer month table so server and client
  // render identically regardless of the runtime's ICU locale support.
  return `${date.getDate()} ${KHMER_MONTHS[date.getMonth()]} ${date.getFullYear()}`
}

export function relatedMemberName(record: {
  members?: { full_name?: string | null } | { full_name?: string | null }[] | null
}) {
  const member = Array.isArray(record.members) ? record.members[0] : record.members
  return member?.full_name ?? 'សមាជិកមិនស្គាល់'
}

export function relatedMemberEmail(record: {
  members?: { email?: string | null } | { email?: string | null }[] | null
}) {
  const member = Array.isArray(record.members) ? record.members[0] : record.members
  return member?.email ?? 'គ្មានអ៊ីមែល'
}

export function sumByCurrency(
  rows: { amount?: number | null; currency?: string | null }[]
): AdminCurrencyTotals {
  const totals: AdminCurrencyTotals = { USD: 0, KHR: 0 }
  for (const row of rows) {
    const currency = normalizeCurrency(row.currency)
    totals[currency] += Number(row.amount ?? 0)
  }
  return totals
}
