import { createAdminClient } from '@/lib/supabase/admin'
import { LoansList } from '@/app/admin/loans/LoansList'
import { AdminPagination, AdminPanel } from '@/components/admin'

export default async function AdminLoansLedgerPage({
  searchParams,
}: {
  searchParams?: Promise<{ page?: string }>
}) {
  const admin = createAdminClient()
  const pageSize = 15
  const params = (await searchParams) ?? {}
  const page = typeof params.page === 'string' ? Math.max(1, Number(params.page)) : 1
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const { data } = await admin
    .from('loans')
    .select(
      'id, member_id, amount, currency, purpose, status, created_at, members:members!loans_member_id_fkey(full_name, email)'
    )
    .order('created_at', { ascending: false })
    .range(from, to)

  const loanRows = data ?? []
  const hasNext = loanRows.length === pageSize
  const hasPrev = page > 1

  return (
    <main className="w-full p-6 md:p-8">
      <AdminPanel
        title="បញ្ជីកម្ជីទាំងអស់"
        description="ពាក្យសុំកម្ជីគ្រប់ស្ថានភាព — ចុចជួរដើម្បីមើលលម្អិត និង ដំណើរការ។"
        footer={
          <AdminPagination basePath="/admin/loans" page={page} hasPrev={hasPrev} hasNext={hasNext} />
        }
      >
        <LoansList loans={loanRows} />
      </AdminPanel>
    </main>
  )
}
