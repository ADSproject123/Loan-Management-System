import { CheckCircle2, Clock, Landmark, Wallet } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/admin'
import { sumByCurrency } from '@/app/admin/adminUtils'
import { LoansList } from '@/app/admin/loans/LoansList'
import { AdminPagination, AdminPanel, AdminStatCard } from '@/components/admin'

export default async function AdminLoansRequestsPage({
  searchParams,
}: {
  searchParams?: Promise<{ page?: string }>
}) {
  const admin = createAdminClient()
  const pageSize = 10

  const params = (await searchParams) ?? {}
  const page = typeof params.page === 'string' ? Math.max(1, Number(params.page)) : 1
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const [{ data }, { count: underReviewTotal }, { count: approvedTotal }] = await Promise.all([
    admin
      .from('loans')
      .select(
        'id, member_id, amount, currency, purpose, status, created_at, members:members!loans_member_id_fkey(full_name, email)'
      )
      .in('status', ['under_review', 'approved'])
      .order('created_at', { ascending: false })
      .range(from, to),
    admin.from('loans').select('id', { count: 'exact', head: true }).eq('status', 'under_review'),
    admin.from('loans').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
  ])

  const loanRows = data ?? []
  const hasNext = loanRows.length === pageSize
  const hasPrev = page > 1
  const pageTotals = sumByCurrency(loanRows)

  return (
    <main className="w-full space-y-8 p-6 md:p-8">
      <AdminPanel
        title="បញ្ជីពាក្យសុំកម្ជី"
        description={`លើទំព័រនេះ ${loanRows.length} កម្ជី • ទំព័រ ${page} · ចុចជួរដើម្បីមើលលម្អិត`}
        footer={
          <AdminPagination
            basePath="/admin/loans/requests"
            page={page}
            hasPrev={hasPrev}
            hasNext={hasNext}
          />
        }
      >
        <LoansList loans={loanRows} />
      </AdminPanel>
    </main>
  )
}
