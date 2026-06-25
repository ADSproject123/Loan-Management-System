import { createAdminClient } from '@/lib/supabase/admin'
import { getPrivateFileUrl } from '@/lib/uploads'
import { getInterestSettings } from '@/lib/interest'
import { RepaymentsTabs, type RepaymentsTabId } from '@/app/admin/payments/RepaymentsTabs'
import { AdminPanel } from '@/components/admin'

export default async function AdminLoansPaymentsLedgerPage({
  searchParams,
}: {
  searchParams?: Promise<{ tab?: string; status?: string }>
}) {
  const admin = createAdminClient()
  const params = (await searchParams) ?? {}
  const defaultTab: RepaymentsTabId =
    params.tab === 'pending' || params.status === 'pending' ? 'pending' : 'due'

  const todayIso = new Date().toISOString().slice(0, 10)
  const currentYear = Number(todayIso.slice(0, 4))
  const currentMonth = Math.min(12, Math.max(1, Number(todayIso.slice(5, 7)) || 1))

  const interestSettings = await getInterestSettings()

  const [{ data: activeLoans }, { data: loanRepayments }, { data: pendingRepayments }, { data: loanDuePayments }] =
    await Promise.all([
      admin
        .from('loans')
        .select(
          'id, member_id, amount, currency, term_months, monthly_interest_rate, start_date, disbursed_at, created_at, members:members!loans_member_id_fkey(full_name, full_name_kh, full_name_en, phone)'
        )
        .eq('status', 'active')
        .order('disbursed_at', { ascending: false }),
      admin.from('loan_repayments').select('loan_id, amount, status'),
      admin
        .from('loan_repayments')
        .select(
          'id, loan_id, member_id, amount, currency, status, evidence_url, qr_code_ref, payment_date, created_at, members:members!loan_repayments_member_id_fkey(full_name, full_name_kh, full_name_en, email)'
        )
        .eq('status', 'pending')
        .order('created_at', { ascending: false }),
      admin.from('loan_due_payments').select('id, loan_id, period_year, period_month, status'),
    ])

  const pendingRows = await Promise.all(
    (pendingRepayments ?? []).map(async (row) => ({
      ...row,
      evidenceSignedUrl: await getPrivateFileUrl(row.evidence_url),
    }))
  )

  return (
    <main>
      <AdminPanel title="បញ្ជីការសងកម្ជី">
        <RepaymentsTabs
          key={defaultTab}
          activeLoans={activeLoans ?? []}
          loanRepayments={loanRepayments ?? []}
          loanDuePayments={loanDuePayments ?? []}
          monthlyLoanInterestRate={interestSettings.monthlyLoanInterestRate}
          asOfDate={todayIso}
          currentYear={currentYear}
          currentMonth={currentMonth}
          pendingRepayments={pendingRows}
          defaultTab={defaultTab}
        />
      </AdminPanel>
    </main>
  )
}
