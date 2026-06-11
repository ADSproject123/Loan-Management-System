import { createAdminClient } from '@/lib/supabase/admin'
import { LoansList } from '@/app/admin/loans/LoansList'
import { AdminPagination, AdminPanel } from '@/components/admin'
import { parseAdminListParams } from '@/lib/admin/pagination'

export default async function AdminLoansLedgerPage({
  searchParams,
}: {
  searchParams?: Promise<{ page?: string; size?: string }>
}) {
  const admin = createAdminClient()
  const params = (await searchParams) ?? {}
  const { page, pageSize, from, to } = parseAdminListParams(params)

  const [{ data }, { count: loansTotal }] = await Promise.all([
    admin
      .from('loans')
      .select(
        'id, member_id, amount, currency, purpose, status, created_at, members:members!loans_member_id_fkey(full_name, email)'
      )
      .order('created_at', { ascending: false })
      .range(from, to),
    admin.from('loans').select('id', { count: 'exact', head: true }),
  ])

  const loanRows = data ?? []
  const hasNext = loanRows.length === pageSize
  const hasPrev = page > 1

  return (
    <main>
      <AdminPanel
        title="បញ្ជីកម្ជីទាំងអស់"
        footer={
          <AdminPagination
            basePath="/admin/loans"
            page={page}
            pageSize={pageSize}
            hasPrev={hasPrev}
            hasNext={hasNext}
            totalCount={loansTotal}
          />
        }
      >
        <LoansList loans={loanRows} />
      </AdminPanel>
    </main>
  )
}
