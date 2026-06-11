import { formatKhmerDate, formatKhmerDateTime } from '@/lib/dates'
import { formatMoney, type CurrencyCode } from '@/lib/currency'

export function money(value: unknown, currency: CurrencyCode = 'USD') {
  return formatMoney(value, currency)
}

export function formatDate(value?: string | null) {
  return formatKhmerDate(value)
}

export function formatDateTime(value?: string | null) {
  return formatKhmerDateTime(value)
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

export function sumAmounts(rows: { amount?: number | null }[]) {
  let total = 0
  for (const row of rows) {
    total += Number(row.amount ?? 0)
  }
  return total
}
