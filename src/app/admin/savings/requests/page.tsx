import { createAdminClient } from '@/lib/supabase/admin'
import { getPrivateFileUrl } from '@/lib/uploads'
import { SavingsList } from '@/app/admin/savings/SavingsList'
import { AdminPagination } from '@/components/admin'
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
        'id, member_id, amount, currency, status, evidence_url, qr_code_ref, saving_date, created_at, members:members!savings_member_id_fkey(full_name, full_name_kh, full_name_en, email)'
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
    <div className="flex min-h-0 flex-1 flex-col">
      <SavingsList savings={savingRows} mode="requests" />
      <div className="-mx-6 mt-6 border-t border-border bg-surface-muted/50 px-6 py-4 md:-mx-8 md:px-8">
        <AdminPagination
          basePath="/admin/savings/requests"
          page={page}
          pageSize={pageSize}
          hasPrev={hasPrev}
          hasNext={hasNext}
          totalCount={pendingTotal}
        />
      </div>
    </div>
  )
}
