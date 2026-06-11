import { requireMember } from '@/lib/auth/member'
import { createAdminClient } from '@/lib/supabase/admin'
import { predominantCurrency } from '@/lib/currency'
import { fetchMemberLoanInterestRate, getInterestSettings } from '@/lib/interest'
import { fetchMemberLoanEligibility } from '@/lib/loanEligibility'
import { LoanRequestForm } from './LoanRequestForm'

export default async function LoanRequestPage() {
  const member = await requireMember()
  const admin = createAdminClient()
  const [settings, eligibility, savingsResult] = await Promise.all([
    getInterestSettings(),
    fetchMemberLoanEligibility(admin, member.id),
    admin
      .from('savings')
      .select('currency, status, verified_at, verified_by')
      .eq('member_id', member.id),
  ])

  const currency = predominantCurrency(savingsResult.data ?? [])

  const monthlyLoanInterestRate = await fetchMemberLoanInterestRate(
    member.id,
    settings.monthlyLoanInterestRate
  )

  return (
    <LoanRequestForm
      monthlyLoanInterestRate={monthlyLoanInterestRate}
      eligibility={eligibility}
      currency={currency}
    />
  )
}
