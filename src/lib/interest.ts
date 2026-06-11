import 'server-only'

import { cache } from 'react'
import { createAdminClient } from '@/lib/supabase/admin'
import { DEFAULT_LOAN_INTEREST_RATE, DEFAULT_SAVING_INTEREST_RATE } from '@/lib/interestCalculations'

export type InterestSettings = {
  monthlySavingInterestRate: number
  monthlyLoanInterestRate: number
  updatedAt?: string | null
}

export {
  DEFAULT_LOAN_INTEREST_RATE,
  DEFAULT_SAVING_INTEREST_RATE,
  annotateLoanPaymentSchedule,
  buildLoanPaymentSchedule,
  loanRepaymentSummary,
  loanTotalOwed,
  monthlySavingInterest,
  resolveLoanInterestRate,
} from '@/lib/interestCalculations'

export {
  fetchMemberLoanInterestRate,
  getLoanInterestPlans,
  resolveMemberLoanInterestRate,
  type LoanInterestPlan,
} from '@/lib/loanInterestPlans'

export type {
  LoanScheduleEntry,
  LoanScheduleRow,
  LoanScheduleStatus,
} from '@/lib/interestCalculations'

function normalizeRate(value: unknown, fallback: number) {
  const rate = Number(value)
  return Number.isFinite(rate) ? rate : fallback
}

export const getInterestSettings = cache(async (): Promise<InterestSettings> => {
  const admin = createAdminClient()
  const { data } = await admin
    .from('interest_settings')
    .select('monthly_saving_interest_rate, monthly_loan_interest_rate, updated_at')
    .eq('id', 1)
    .maybeSingle()

  if (!data) {
    return {
      monthlySavingInterestRate: DEFAULT_SAVING_INTEREST_RATE,
      monthlyLoanInterestRate: DEFAULT_LOAN_INTEREST_RATE,
    }
  }

  return {
    monthlySavingInterestRate: normalizeRate(
      data.monthly_saving_interest_rate,
      DEFAULT_SAVING_INTEREST_RATE
    ),
    monthlyLoanInterestRate: normalizeRate(data.monthly_loan_interest_rate, DEFAULT_LOAN_INTEREST_RATE),
    updatedAt: data.updated_at,
  }
})
