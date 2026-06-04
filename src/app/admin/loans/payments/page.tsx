import { Clock, CreditCard } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/admin'
import { getPrivateFileUrl } from '@/lib/uploads'
import { RepaymentsList } from '@/app/admin/payments/RepaymentsList'
import { AdminPagination, AdminPanel, AdminStatCard } from '@/components/admin'
import { parseAdminListParams } from '@/lib/admin/pagination'

export default async function AdminLoansPaymentsLedgerPage({
  searchParams,
}: {
  searchParams?: Promise<{ page?: string; size?: string; status?: string }>
}) {
  const admin = createAdminClient()
  const params = (await searchParams) ?? {}
  const { page, pageSize, from, to } = parseAdminListParams(params)
  const initialStatusFilter = params.status === 'pending' ? 'pending' : ''
  const paginationQuery =
    initialStatusFilter === 'pending' ? { status: 'pending' } : undefined

  const [{ data }, { count: pendingTotal }, { count: repaymentsTotal }] = await Promise.all([
    admin
      .from('loan_repayments')
      .select(
        'id, loan_id, member_id, amount, currency, status, evidence_url, payment_date, created_at, members:members!loan_repayments_member_id_fkey(full_name, email)'
      )
      .order('created_at', { ascending: false })
      .range(from, to),
    admin
      .from('loan_repayments')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending'),
    admin.from('loan_repayments').select('id', { count: 'exact', head: true }),
  ])

  const repaymentRows = await Promise.all(
    (data ?? []).map(async (row) => ({
      ...row,
      evidenceSignedUrl: await getPrivateFileUrl(row.evidence_url),
    }))
  )

  const hasNext = repaymentRows.length === pageSize
  const hasPrev = page > 1

  return (
    <main className="w-full space-y-6 p-6 md:p-8">
      <div className="grid gap-4 sm:grid-cols-2">
        <AdminStatCard label="រង់ផ្ទៀងផ្ទាត់" value={pendingTotal ?? 0} icon={Clock} tone="amber" />
        <AdminStatCard label="លើទំព័រនេះ" value={repaymentRows.length} icon={CreditCard} tone="blue" />
      </div>

      <AdminPanel
        title="បញ្ជីការសងកម្ជី"
        description="ប្រវត្តិការសងប្រាក់ — តម្រង «រង់ផ្ទៀងផ្ទាត់» ដើម្បីផ្ទៀងផ្ទាត់ ឬ ស្វែងរកតាមសមាជិក។"
        footer={
          <AdminPagination
            basePath="/admin/loans/payments"
            page={page}
            pageSize={pageSize}
            hasPrev={hasPrev}
            hasNext={hasNext}
            totalCount={repaymentsTotal}
            query={paginationQuery}
          />
        }
      >
        <RepaymentsList repayments={repaymentRows} initialStatusFilter={initialStatusFilter} />
      </AdminPanel>
    </main>
  )
}
