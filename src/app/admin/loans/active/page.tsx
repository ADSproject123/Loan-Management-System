import { createAdminClient } from '@/lib/supabase/admin'
import { LoansList } from '@/app/admin/loans/LoansList'
import { AdminPagination, AdminPanel } from '@/components/admin'
import { parseAdminListParams } from '@/lib/admin/pagination'

export default async function AdminActiveLoansPage({
  searchParams,
}: {
  searchParams?: Promise<{ page?: string; size?: string }>
}) {
  const admin = createAdminClient()
  const params = (await searchParams) ?? {}
  const { page, pageSize, from, to } = parseAdminListParams(params)

  const [{ data }, { count: activeTotal }] = await Promise.all([
    admin
      .from('loans')
      .select(
        'id, member_id, amount, currency, purpose, status, created_at, due_date, disbursed_at, members:members!loans_member_id_fkey(full_name, email)'
      )
      .eq('status', 'active')
      .order('disbursed_at', { ascending: false })
      .range(from, to),
    admin.from('loans').select('id', { count: 'exact', head: true }).eq('status', 'active'),
  ])

  const loanRows = data ?? []
  const hasNext = loanRows.length === pageSize
  const hasPrev = page > 1

  return (
    <main>
      <AdminPanel
        title="កម្ជីកំពុងដំណើរការ"
        footer={
          <AdminPagination
            basePath="/admin/loans/active"
            page={page}
            pageSize={pageSize}
            hasPrev={hasPrev}
            hasNext={hasNext}
            totalCount={activeTotal}
          />
        }
      >
        <LoansList loans={loanRows} variant="active" />
      </AdminPanel>
    </main>
  )
}
