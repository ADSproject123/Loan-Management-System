import { Clock, Wallet } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/admin'
import { CapitalRequestsList } from '@/app/admin/capital/CapitalRequestsList'
import { AdminPagination, AdminPanel, AdminStatCard } from '@/components/admin'
import { parseAdminListParams } from '@/lib/admin/pagination'

export default async function AdminSavingsCapitalPage({
  searchParams,
}: {
  searchParams?: Promise<{ page?: string; size?: string }>
}) {
  const admin = createAdminClient()
  const params = (await searchParams) ?? {}
  const { page, pageSize, from, to } = parseAdminListParams(params)

  const [{ data }, { count: pendingTotal }, { count: requestsTotal }] = await Promise.all([
    admin
      .from('capital_requests')
      .select(
        'id, amount, reason, status, continue_saving, remove_membership, rejection_reason, created_at, members:members!capital_requests_member_id_fkey(full_name, email)'
      )
      .order('created_at', { ascending: false })
      .range(from, to),
    admin
      .from('capital_requests')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending'),
    admin.from('capital_requests').select('id', { count: 'exact', head: true }),
  ])

  const requests = data ?? []
  const hasNext = requests.length === pageSize
  const hasPrev = page > 1

  return (
    <main className="w-full space-y-6 p-6 md:p-8">
      <div className="grid gap-4 sm:grid-cols-2">
        <AdminStatCard label="រង់ចាំសម្រេច" value={pendingTotal ?? 0} icon={Clock} tone="amber" />
        <AdminStatCard label="លើទំព័រនេះ" value={requests.length} icon={Wallet} tone="blue" />
      </div>

      <AdminPanel
        title="ស្នើសុំដកដើមទុន"
        description="ពិនិត្យ ទទួលយក ឬ បដិសេធ — តម្រង «រង់ចាំ» ដើម្បីមើលតែពាក្យសុំដែលត្រូវដោះស្រាយ។"
        footer={
          <AdminPagination
            basePath="/admin/savings/capital"
            page={page}
            pageSize={pageSize}
            hasPrev={hasPrev}
            hasNext={hasNext}
            totalCount={requestsTotal}
          />
        }
      >
        <CapitalRequestsList requests={requests} />
      </AdminPanel>
    </main>
  )
}
