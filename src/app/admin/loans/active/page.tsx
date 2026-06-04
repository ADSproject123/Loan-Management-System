import { Landmark } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/admin'
import { sumByCurrency } from '@/app/admin/adminUtils'
import { LoansList } from '@/app/admin/loans/LoansList'
import { AdminPagination, AdminPanel, AdminStatCard } from '@/components/admin'
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
  const pageTotals = sumByCurrency(loanRows)

  return (
    <main className="w-full space-y-6 p-6 md:p-8">
      <div className="grid gap-4 sm:grid-cols-2">
        <AdminStatCard label="កម្ជីសកម្មសរុប" value={activeTotal ?? 0} icon={Landmark} tone="emerald" />
        <AdminStatCard label="សរុបទំព័រនេះ" currencyTotals={pageTotals} icon={Landmark} tone="blue" />
      </div>

      <AdminPanel
        title="កម្ជីកំពុងដំណើរការ"
        description="កម្ជីដែលបានបើកប្រាក់ហើយ — តាមដានការសង និង កាលបរិច្ឆេទបង់។"
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
        <LoansList loans={loanRows} />
      </AdminPanel>
    </main>
  )
}
