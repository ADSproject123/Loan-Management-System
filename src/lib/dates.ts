export const KHMER_MONTHS = [
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
] as const

type DateParts = { year: number; month: number; day: number }

function parseDateParts(value: string): DateParts | null {
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim())
  if (dateOnly) {
    const year = Number(dateOnly[1])
    const month = Number(dateOnly[2])
    const day = Number(dateOnly[3])
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return { year, month, day }
    }
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null

  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
  }
}

/**
 * Add a number of months to a YYYY-MM-DD date, clamping the day to the last
 * valid day of the target month. Plain `Date.setMonth` overflows — e.g.
 * Jan 31 + 1 month becomes Mar 3 instead of Feb 28/29 — which silently skips a
 * month in loan due-date schedules. Operates purely on calendar parts in UTC so
 * it is timezone-safe.
 */
export function addMonths(isoDate: string, monthsAhead: number): string {
  const parts = parseDateParts(isoDate)
  if (!parts) return isoDate
  const base = new Date(Date.UTC(parts.year, parts.month - 1, 1))
  base.setUTCMonth(base.getUTCMonth() + monthsAhead)
  const lastDayOfTargetMonth = new Date(
    Date.UTC(base.getUTCFullYear(), base.getUTCMonth() + 1, 0)
  ).getUTCDate()
  base.setUTCDate(Math.min(parts.day, lastDayOfTargetMonth))
  return base.toISOString().slice(0, 10)
}

/** Today's UTC calendar day as YYYY-MM-DD (matches existing toISOString usage). */
export function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

/** Whole calendar months from one YYYY-MM-DD date to another (exclusive of partial month). */
export function calendarMonthsBetween(fromIso: string, toIso: string): number | null {
  const from = parseDateParts(fromIso)
  const to = parseDateParts(toIso)
  if (!from || !to) return null

  let months = (to.year - from.year) * 12 + (to.month - from.month)
  if (to.day < from.day) months -= 1
  return months
}

/** Signed calendar months from today to a due date (negative = overdue). */
export function monthsUntilDueDate(dueIso: string, fromIso = todayIso()): number | null {
  const due = parseDateParts(dueIso)
  const from = parseDateParts(fromIso)
  if (!due || !from) return null

  const dueTime = Date.UTC(due.year, due.month - 1, due.day)
  const fromTime = Date.UTC(from.year, from.month - 1, from.day)

  if (dueTime === fromTime) return 0
  if (dueTime < fromTime) {
    const overdue = calendarMonthsBetween(dueIso, fromIso)
    return overdue == null ? null : -overdue
  }

  const remaining = calendarMonthsBetween(fromIso, dueIso)
  return remaining == null ? null : Math.max(0, remaining)
}

/** Calendar months past due (null if not overdue). */
export function monthsOverdueSinceDueDate(dueIso: string, fromIso = todayIso()): number | null {
  const diffMonths = monthsUntilDueDate(dueIso, fromIso)
  if (diffMonths == null || diffMonths >= 0) return null
  return Math.abs(diffMonths)
}


/** Fixed Khmer formatting — safe for SSR and client hydration. */
export function formatKhmerDate(value?: string | null, fallback = 'មិនកំណត់') {
  if (!value) return fallback
  const parts = parseDateParts(value)
  if (!parts) return fallback
  return `${parts.day} ${KHMER_MONTHS[parts.month - 1]} ${parts.year}`
}

/** "មិថុនា 2026" — month + year only. */
export function formatKhmerMonthYear(value?: string | null, fallback = 'មិនកំណត់') {
  if (!value) return fallback
  const parts = parseDateParts(value)
  if (!parts) return fallback
  return `${KHMER_MONTHS[parts.month - 1]} ${parts.year}`
}

export function formatKhmerDateTime(value?: string | null) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  const hours = String(date.getUTCHours()).padStart(2, '0')
  const minutes = String(date.getUTCMinutes()).padStart(2, '0')
  return `${formatKhmerDate(value)} ${hours}:${minutes}`
}
