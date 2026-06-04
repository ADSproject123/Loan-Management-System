import { createAdminClient } from '@/lib/supabase/admin'
import { getPrivateFileUrl } from '@/lib/uploads'
import { SavingsList } from '@/app/admin/savings/SavingsList'
import { AdminPagination, AdminPanel } from '@/components/admin'
import { parseAdminListParams } from '@/lib/admin/pagination'

export default async function AdminSavingsLedgerPage({
  searchParams,
}: {
  searchParams?: Promise<{ page?: string; size?: string }>
}) {
  const admin = createAdminClient()
  const params = (await searchParams) ?? {}
  const { page, pageSize, from, to } = parseAdminListParams(params)

  const [{ data }, { count: savingsTotal }] = await Promise.all([
    admin
    .from('savings')
    .select(
      'id, member_id, amount, currency, status, evidence_url, saving_date, created_at, members:members!savings_member_id_fkey(full_name, email)'
    )
      .order('created_at', { ascending: false })
      .range(from, to),
    admin.from('savings').select('id', { count: 'exact', head: true }),
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
    <main className="w-full p-6 md:p-8">
      <AdminPanel
        title="បញ្ជីការសន្សំទាំងអស់"
        description="ប្រវត្តិការដាក់សន្សំ — ស្វែងរក តម្រងតាមស្ថានភាព និង ថ្ងៃខែ។"
        footer={
          <AdminPagination
            basePath="/admin/savings"
            page={page}
            pageSize={pageSize}
            hasPrev={hasPrev}
            hasNext={hasNext}
            totalCount={savingsTotal}
          />
        }
      >
        <SavingsList savings={savingRows} />
      </AdminPanel>
    </main>
  )
}
