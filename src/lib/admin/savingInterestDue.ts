import { monthlySavingInterest, savingInterestStartDate } from '@/lib/interestCalculations'
import { isVerifiedSaving } from '@/lib/loanEligibility'
import { memberKhmerName, memberSearchText } from '@/lib/memberNames'
import type { SavingInterestPaymentStatus } from '@/types/database'

export type SavingInterestDueRow = {
  recordId: string | null
  memberId: string
  memberName: string
  memberSearchText: string
  memberPhone: string | null
  savingsBalance: number
  interestDue: number
  currency: string
  interestDate: string
  periodYear: number
  periodMonth: number
  status: SavingInterestPaymentStatus
  isOverdue: boolean
}

export type SavingInterestPaymentRow = {
  id: string
  member_id: string
  period_year: number
  period_month: number
  status: string
}

export type VerifiedSavingInterestRow = {
  id: string
  member_id: string
  amount: number | null
  currency: string | null
  status: string
  saving_date: string | null
  verified_at?: string | null
  verified_by?: string | null
  members?:
    | {
        full_name?: string | null
        full_name_kh?: string | null
        full_name_en?: string | null
        phone?: string | null
      }
    | {
        full_name?: string | null
        full_name_kh?: string | null
        full_name_en?: string | null
        phone?: string | null
      }[]
    | null
}

function datePartsFromIso(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim())
  if (!match) return null
  return { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) }
}

function interestPayDateInMonth(savingDay: number, year: number, month: number) {
  const lastDay = new Date(year, month, 0).getDate()
  const day = Math.min(savingDay, lastDay)
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function lastDayOfMonth(year: number, month: number) {
  const day = new Date(year, month, 0).getDate()
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function memberDisplayName(members: VerifiedSavingInterestRow['members']) {
  const member = Array.isArray(members) ? members[0] : members
  return {
    name: memberKhmerName(member),
    searchText: memberSearchText(member),
    phone: member?.phone ?? null,
  }
}

function normalizeInterestPaymentStatus(status: string | undefined): SavingInterestPaymentStatus {
  if (status === 'completed' || status === 'verified') return 'completed'
  if (status === 'rejected' || status === 'refunded') return 'rejected'
  return 'pending'
}

type DatedDepositRow = {
  row: VerifiedSavingInterestRow
  start: string
  amount: number
}

function datedDeposits(deposits: VerifiedSavingInterestRow[]): DatedDepositRow[] {
  return deposits
    .map((row) => ({
      row,
      start: savingInterestStartDate(row) ?? '',
      amount: Number(row.amount ?? 0),
    }))
    .filter((entry): entry is DatedDepositRow => Boolean(entry.start) && entry.amount > 0)
    .sort((a, b) => a.start.localeCompare(b.start))
}

function combinedBalanceThroughDate(deposits: DatedDepositRow[], throughDate: string) {
  return deposits
    .filter((deposit) => deposit.start <= throughDate)
    .reduce((sum, deposit) => sum + deposit.amount, 0)
}

export function buildSavingInterestDueRowsForMonth(
  savings: VerifiedSavingInterestRow[],
  ratePercent: number,
  year: number,
  month: number,
  asOfDate: string,
  payments: SavingInterestPaymentRow[] = []
): SavingInterestDueRow[] {
  const asOf = asOfDate.slice(0, 10)
  const monthEnd = lastDayOfMonth(year, month)
  const paymentsByMember = payments.reduce<Record<string, SavingInterestPaymentRow>>((acc, row) => {
    if (row.period_year === year && row.period_month === month) {
      acc[row.member_id] = row
    }
    return acc
  }, {})

  const memberDeposits = new Map<string, VerifiedSavingInterestRow[]>()
  for (const saving of savings) {
    if (!isVerifiedSaving(saving)) continue
    const list = memberDeposits.get(saving.member_id) ?? []
    list.push(saving)
    memberDeposits.set(saving.member_id, list)
  }

  const rows: SavingInterestDueRow[] = []

  for (const [memberId, deposits] of memberDeposits) {
    const dated = datedDeposits(deposits)
    if (dated.length === 0) continue

    const firstStart = dated[0].start
    const firstParts = datePartsFromIso(firstStart)
    if (!firstParts) continue
    if (firstStart > monthEnd) continue

    const balance = combinedBalanceThroughDate(dated, monthEnd)
    if (balance <= 0) continue

    const payDate = interestPayDateInMonth(firstParts.day, year, month)
    const interestDue = monthlySavingInterest(balance, ratePercent)
    const { name, searchText, phone } = memberDisplayName(dated[0].row.members)
    const payment = paymentsByMember[memberId]
    const status = normalizeInterestPaymentStatus(payment?.status)
    const isOverdue = status === 'pending' && payDate < asOf

    rows.push({
      recordId: payment?.id ?? null,
      memberId,
      memberName: name,
      memberSearchText: searchText,
      memberPhone: phone,
      savingsBalance: balance,
      interestDue,
      currency: dated[0].row.currency ?? 'USD',
      interestDate: payDate,
      periodYear: year,
      periodMonth: month,
      status,
      isOverdue,
    })
  }

  return rows.sort((a, b) => {
    const aTime = new Date(a.interestDate).getTime()
    const bTime = new Date(b.interestDate).getTime()
    return aTime - bTime
  })
}
