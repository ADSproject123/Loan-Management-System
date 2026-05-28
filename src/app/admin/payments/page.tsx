import { Card } from '@/components/ui/Card'
import { SavingStatusBadge } from '@/components/ui/Badge'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyRepayment, verifySaving } from '@/app/actions/admin'
import { AdminActionButton } from '@/app/admin/AdminActionButton'
import { formatDate, money, relatedMemberEmail, relatedMemberName } from '@/app/admin/adminUtils'
import type { SavingStatus } from '@/types/database'

export default async function AdminPaymentsPage() {
  const admin = createAdminClient()
  const [savings, repayments] = await Promise.all([
    admin
      .from('savings')
      .select('id, amount, status, evidence_url, saving_date, created_at, members(full_name, email)')
      .order('created_at', { ascending: false }),
    admin
      .from('loan_repayments')
      .select('id, amount, status, evidence_url, payment_date, created_at, members(full_name, email)')
      .order('created_at', { ascending: false }),
  ])

  const savingRows = savings.data ?? []
  const repaymentRows = repayments.data ?? []

  return (
    <main className="space-y-6 p-6 md:p-8 max-w-7xl mx-auto">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">Admin</p>
        <h2 className="text-2xl font-bold text-gray-900">Payment Verification</h2>
        <p className="text-sm text-gray-500">Verify saving evidence and loan repayment screenshots.</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Savings</h3>
          <div className="space-y-3">
            {savingRows.length === 0 && <p className="text-sm text-gray-500">No savings submitted.</p>}
            {savingRows.map((saving) => (
              <div key={saving.id} className="rounded-2xl border border-gray-100 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-gray-900">{money(saving.amount)}</p>
                    <p className="text-sm text-gray-500">{relatedMemberName(saving)} • {relatedMemberEmail(saving)}</p>
                    <p className="mt-1 text-xs text-gray-400">Saving date: {formatDate(saving.saving_date)}</p>
                    <p className="mt-1 truncate text-xs text-gray-400">Evidence: {saving.evidence_url ?? 'Missing'}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <SavingStatusBadge status={saving.status as SavingStatus} />
                    {saving.status === 'pending' && <AdminActionButton action={verifySaving} id={saving.id}>Verify</AdminActionButton>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Loan Repayments</h3>
          <div className="space-y-3">
            {repaymentRows.length === 0 && <p className="text-sm text-gray-500">No repayments submitted.</p>}
            {repaymentRows.map((repayment) => (
              <div key={repayment.id} className="rounded-2xl border border-gray-100 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-gray-900">{money(repayment.amount)}</p>
                    <p className="text-sm text-gray-500">{relatedMemberName(repayment)} • {relatedMemberEmail(repayment)}</p>
                    <p className="mt-1 text-xs text-gray-400">Payment date: {formatDate(repayment.payment_date)}</p>
                    <p className="mt-1 truncate text-xs text-gray-400">Evidence: {repayment.evidence_url ?? 'Missing'}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <SavingStatusBadge status={repayment.status as SavingStatus} />
                    {repayment.status === 'pending' && <AdminActionButton action={verifyRepayment} id={repayment.id}>Verify</AdminActionButton>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </main>
  )
}
