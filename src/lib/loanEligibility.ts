import type { SupabaseClient } from '@supabase/supabase-js'
import { formatMoney } from '@/lib/currency'
import type { LoanStatus } from '@/types/database'

export const LOAN_TO_SAVINGS_MULTIPLIER = 5

const COMMITTED_LOAN_STATUSES: LoanStatus[] = [
  'pending',
  'under_review',
  'approved',
  'active',
]

type SavingRow = {
  amount: unknown
  status: string
  verified_at?: string | null
  verified_by?: string | null
}

type LoanRow = {
  amount: unknown
  status: string
}

function toNumber(value: unknown) {
  const numberValue = Number(value ?? 0)
  return Number.isFinite(numberValue) ? numberValue : 0
}

export function isVerifiedSaving(saving: SavingRow) {
  if (saving.status === 'refunded') return false
  if (saving.verified_at || saving.verified_by) return true
  return saving.status === 'verified' || saving.status === 'completed'
}

export function sumVerifiedSavings(savings: SavingRow[]) {
  return savings
    .filter(isVerifiedSaving)
    .reduce((sum, saving) => sum + toNumber(saving.amount), 0)
}

export function sumCommittedLoanPrincipal(loans: LoanRow[]) {
  return loans
    .filter((loan) => COMMITTED_LOAN_STATUSES.includes(loan.status as LoanStatus))
    .reduce((sum, loan) => sum + toNumber(loan.amount), 0)
}

export type LoanEligibility = {
  canRequestLoan: boolean
  totalSavings: number
  maxTotalLoanPrincipal: number
  committedLoanPrincipal: number
  availableLoanAmount: number
}

export function getLoanEligibility(
  totalSavings: number,
  committedLoanPrincipal: number
): LoanEligibility {
  const maxTotalLoanPrincipal = totalSavings * LOAN_TO_SAVINGS_MULTIPLIER
  const availableLoanAmount = Math.max(maxTotalLoanPrincipal - committedLoanPrincipal, 0)

  return {
    canRequestLoan: totalSavings > 0 && availableLoanAmount > 0,
    totalSavings,
    maxTotalLoanPrincipal,
    committedLoanPrincipal,
    availableLoanAmount,
  }
}

export function validateLoanRequestAmount(
  amount: number,
  eligibility: LoanEligibility
): { valid: true } | { valid: false; error: string } {
  if (eligibility.totalSavings <= 0) {
    return {
      valid: false,
      error: 'អ្នកត្រូវមានការសន្សំដែលបានផ្ទៀងផ្ទាត់មុនពេលអាចស្នើសុំកម្ជីបាន។',
    }
  }

  if (eligibility.availableLoanAmount <= 0) {
    return {
      valid: false,
      error: `អ្នកបានឈានដល់ដែនកំណត់កម្ជីអតិបរមារួចហើយ (${LOAN_TO_SAVINGS_MULTIPLIER} ដងនៃសមតុល្យសន្សំ)។`,
    }
  }

  if (amount > eligibility.availableLoanAmount) {
    return {
      valid: false,
      error: `ចំនួនទឹកប្រាក់កម្ជីមិនអាចលើសអតិបរមា ${formatMoney(eligibility.availableLoanAmount)} ។ អ្នកអាចស្នើសុំបានរហូតដល់ ${LOAN_TO_SAVINGS_MULTIPLIER} ដងនៃសមតុល្យសន្សំរបស់អ្នក។`,
    }
  }

  return { valid: true }
}

export async function fetchMemberLoanEligibility(
  admin: SupabaseClient,
  memberId: string
): Promise<LoanEligibility> {
  const [savingsResult, loansResult] = await Promise.all([
    admin
      .from('savings')
      .select('amount, status, verified_at, verified_by')
      .eq('member_id', memberId),
    admin.from('loans').select('amount, status').eq('member_id', memberId),
  ])

  const totalSavings = sumVerifiedSavings(savingsResult.data ?? [])
  const committedLoanPrincipal = sumCommittedLoanPrincipal(loansResult.data ?? [])

  return getLoanEligibility(totalSavings, committedLoanPrincipal)
}
