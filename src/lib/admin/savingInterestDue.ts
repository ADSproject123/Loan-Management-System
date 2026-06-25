import { monthlySavingInterest } from '@/lib/interestCalculations'
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

export function buildSavingInterestDueRowsForMonth(
  savings: VerifiedSavingInterestRow[],
  ratePercent: number,
  year: number,
  month: number,
  asOfDate: string,
  payments: SavingInterestPaymentRow[] = []
): SavingInterestDueRow[] {
  const asOf = asOfDate.slice(0, 10)
  const paymentsByMember = payments.reduce<Record<string, SavingInterestPaymentRow>>((acc, row) => {
    if (row.period_year === year && row.period_month === month) {
      acc[row.member_id] = row
    }
    return acc
  }, {})
  const byMember = new Map<
    string,
    {
      memberId: string
      memberName: string
      memberSearchText: string
      memberPhone: string | null
      savingsBalance: number
      interestDue: number
      currency: string
      interestDates: string[]
    }
  >()

  for (const saving of savings) {
    if (!isVerifiedSaving(saving)) continue

    const startDate = saving.saving_date?.slice(0, 10) ?? null
    if (!startDate) continue

    const startParts = datePartsFromIso(startDate)
    if (!startParts) continue

    const payDate = interestPayDateInMonth(startParts.day, year, month)
    if (startDate > payDate) continue

    const amount = Number(saving.amount ?? 0)
    if (amount <= 0) continue

    const interest = monthlySavingInterest(amount, ratePercent)
    const { name, searchText, phone } = memberDisplayName(saving.members)
    const existing = byMember.get(saving.member_id)

    if (!existing) {
      byMember.set(saving.member_id, {
        memberId: saving.member_id,
        memberName: name,
        memberSearchText: searchText,
        memberPhone: phone,
        savingsBalance: amount,
        interestDue: interest,
        currency: saving.currency ?? 'USD',
        interestDates: [payDate],
      })
      continue
    }

    existing.savingsBalance += amount
    existing.interestDue += interest
    existing.interestDates.push(payDate)
    if (!existing.memberPhone && phone) existing.memberPhone = phone
  }

  const rows: SavingInterestDueRow[] = []

  for (const group of byMember.values()) {
    const interestDate = group.interestDates.sort()[0]
    const payment = paymentsByMember[group.memberId]
    const status = normalizeInterestPaymentStatus(payment?.status)
    const isOverdue = status === 'pending' && interestDate < asOf

    rows.push({
      recordId: payment?.id ?? null,
      memberId: group.memberId,
      memberName: group.memberName,
      memberSearchText: group.memberSearchText,
      memberPhone: group.memberPhone,
      savingsBalance: group.savingsBalance,
      interestDue: group.interestDue,
      currency: group.currency,
      interestDate,
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
