import { createAdminClient } from '@/lib/supabase/admin'
import { LoansList } from '@/app/admin/loans/LoansList'
import { AdminPagination, AdminPanel } from '@/components/admin'
import { parseAdminListParams } from '@/lib/admin/pagination'

export default async function AdminLoansRequestsPage({
  searchParams,
}: {
  searchParams?: Promise<{ page?: string; size?: string }>
}) {
  const admin = createAdminClient()
  const params = (await searchParams) ?? {}
  const { page, pageSize, from, to } = parseAdminListParams(params, { defaultPageSize: 10 })

  const [{ data }, { count: requestsTotal }] = await Promise.all([
    admin
      .from('loans')
      .select(
        'id, member_id, amount, currency, purpose, status, created_at, members:members!loans_member_id_fkey(full_name, full_name_kh, full_name_en, email)'
      )
      .in('status', ['under_review', 'approved'])
      .order('created_at', { ascending: false })
      .range(from, to),
    admin
      .from('loans')
      .select('id', { count: 'exact', head: true })
      .in('status', ['under_review', 'approved']),
  ])

  const loanRows = data ?? []
  const hasNext = loanRows.length === pageSize
  const hasPrev = page > 1

  return (
    <main>
      <AdminPanel
        title="បញ្ជីពាក្យសុំកម្ជី"
        footer={
          <AdminPagination
            basePath="/admin/loans/requests"
            page={page}
            pageSize={pageSize}
            hasPrev={hasPrev}
            hasNext={hasNext}
            totalCount={requestsTotal}
          />
        }
      >
        <LoansList loans={loanRows} variant="requests" />
      </AdminPanel>
    </main>
  )
}
