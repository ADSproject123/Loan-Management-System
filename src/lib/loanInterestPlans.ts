import 'server-only'

import { cache } from 'react'
import { createAdminClient } from '@/lib/supabase/admin'
import { DEFAULT_LOAN_INTEREST_RATE } from '@/lib/interestCalculations'
import type { MemberRole } from '@/types/database'

export type LoanInterestPlan = {
  id: string
  name: string
  monthlyRate: number
  description: string | null
  isActive: boolean
  appliesToRole: MemberRole | null
}

type PlanRow = {
  id: string
  name: string
  monthly_rate: number
  description: string | null
  is_active: boolean
  applies_to_role: MemberRole | null
}

function mapPlan(row: PlanRow): LoanInterestPlan {
  return {
    id: row.id,
    name: row.name,
    monthlyRate: Number(row.monthly_rate),
    description: row.description,
    isActive: row.is_active,
    appliesToRole: row.applies_to_role ?? null,
  }
}

export const getLoanInterestPlans = cache(async (activeOnly = false): Promise<LoanInterestPlan[]> => {
  const admin = createAdminClient()
  let query = admin
    .from('loan_interest_plans')
    .select('id, name, monthly_rate, description, is_active, applies_to_role')
    .order('name', { ascending: true })

  if (activeOnly) {
    query = query.eq('is_active', true)
  }

  const { data } = await query
  return (data ?? []).map((row) => mapPlan(row as PlanRow))
})

type MemberWithPlan = {
  loan_interest_plan_id?: string | null
  loan_interest_plan?:
    | { monthly_rate: number; is_active?: boolean }
    | { monthly_rate: number; is_active?: boolean }[]
    | null
}

export function resolveMemberLoanInterestRateFromPlan(
  member: MemberWithPlan,
  globalRate = DEFAULT_LOAN_INTEREST_RATE
) {
  const plan = Array.isArray(member.loan_interest_plan)
    ? member.loan_interest_plan[0]
    : member.loan_interest_plan

  if (plan && plan.is_active === false) {
    return globalRate
  }

  const planRate = Number(plan?.monthly_rate)
  if (Number.isFinite(planRate) && planRate >= 0) {
    return planRate
  }

  return globalRate
}

export async function fetchMemberLoanInterestRate(
  memberId: string,
  globalRate = DEFAULT_LOAN_INTEREST_RATE
): Promise<number> {
  const admin = createAdminClient()
  const { data } = await admin
    .from('members')
    .select('loan_interest_plan_id, loan_interest_plan:loan_interest_plan_id(monthly_rate, is_active)')
    .eq('id', memberId)
    .maybeSingle()

  if (!data) return globalRate
  return resolveMemberLoanInterestRateFromPlan(data, globalRate)
}

// Keep export name used across the app; plan-based resolution replaces per-member custom rate.
export { resolveMemberLoanInterestRateFromPlan as resolveMemberLoanInterestRate }
