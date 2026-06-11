import { createAdminClient } from '@/lib/supabase/admin'
import { getPrivateFileUrl } from '@/lib/uploads'
import { SavingsList } from '@/app/admin/savings/SavingsList'
import { AdminPagination, AdminPanel } from '@/components/admin'
import { parseAdminListParams } from '@/lib/admin/pagination'

export default async function AdminSavingsRequestsPage({
  searchParams,
}: {
  searchParams?: Promise<{ page?: string; size?: string }>
}) {
  const admin = createAdminClient()
  const params = (await searchParams) ?? {}
  const { page, pageSize, from, to } = parseAdminListParams(params, { defaultPageSize: 10 })

  const [{ data }, { count: pendingTotal }] = await Promise.all([
    admin
      .from('savings')
      .select(
        'id, member_id, amount, currency, status, evidence_url, saving_date, created_at, members:members!savings_member_id_fkey(full_name, email)'
      )
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .range(from, to),
    admin.from('savings').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
  ])

  const savingRows = await Promise.all(
    (data ?? []).map(async (saving) => ({
      ...saving,
      evidenceSignedUrl: await getPrivateFileUrl(saving.evidence_url),
    }))
  )

  const hasNext = savingRows.length === pageSize
  const hasPrev = page > 1

  return (
    <main>
      <AdminPanel
        title="បញ្ជីសំណើសន្សំ"
        footer={
          <AdminPagination
            basePath="/admin/savings/requests"
            page={page}
            pageSize={pageSize}
            hasPrev={hasPrev}
            hasNext={hasNext}
            totalCount={pendingTotal}
          />
        }
      >
        <SavingsList savings={savingRows} />
      </AdminPanel>
    </main>
  )
}
