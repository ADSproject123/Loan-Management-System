import { createAdminClient } from '@/lib/supabase/admin'
import { enrichLoansWithScheduleMeta } from '@/lib/admin/loanScheduleMeta'
import { getInterestSettings } from '@/lib/interest'
import { LoansList } from '@/app/admin/loans/LoansList'

export default async function AdminActiveLoansPage() {
  const admin = createAdminClient()
  const interestSettings = await getInterestSettings()

  const { data } = await admin
    .from('loans')
    .select(
      'id, member_id, amount, currency, purpose, status, created_at, due_date, disbursed_at, start_date, term_months, monthly_interest_rate, members:members!loans_member_id_fkey(full_name, full_name_kh, full_name_en, email)'
    )
    .eq('status', 'active')
    .order('disbursed_at', { ascending: false })

  const loans = data ?? []
  const loanIds = loans.map((loan) => loan.id)

  const { data: repayments } =
    loanIds.length > 0
      ? await admin
          .from('loan_repayments')
          .select('loan_id, amount, status')
          .in('loan_id', loanIds)
      : { data: [] }

  const enrichedLoans = enrichLoansWithScheduleMeta(
    loans,
    repayments ?? [],
    interestSettings.monthlyLoanInterestRate
  )

  return <LoansList loans={enrichedLoans} variant="active" mode="ledger" />
}
