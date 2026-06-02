import { Clock, FileImage, PiggyBank, Wallet } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/admin'
import { getPrivateFileUrl } from '@/lib/uploads'
import { sumByCurrency } from '@/app/admin/adminUtils'
import { SavingsList } from '@/app/admin/savings/SavingsList'
import {
  AdminPageHeader,
  AdminPagination,
  AdminPanel,
  AdminStatCard,
} from '@/components/admin'

export default async function AdminSavingsPage({
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
  const pageTotals = sumByCurrency(savingRows)
  const withEvidence = savingRows.filter((row) => row.evidence_url).length

  return (
    <main className="w-full space-y-8 p-6 md:p-8">
      <AdminPageHeader
        title="គ្រប់គ្រងការសន្សំ"
        description="ផ្ទៀងផ្ទាត់សំណើដាក់សន្សំរបស់សមាជិក ពិនិត្យភស្តុតាងការបង់ប្រាក់ និងអនុម័តឱ្យបញ្ចូលទៅក្នុងប្រព័ន្ធ។"
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard
          label="រង់ចាំផ្ទៀងផ្ទាត់"
          value={pendingTotal ?? 0}
          icon={Clock}
          tone="amber"
        />
        <AdminStatCard label="លើទំព័រនេះ" value={savingRows.length} icon={PiggyBank} tone="blue" />
        <AdminStatCard label="មានភស្តុតាង" value={withEvidence} icon={FileImage} tone="emerald" />
        <AdminStatCard
          label="សរុបទំព័រនេះ"
          currencyTotals={pageTotals}
          icon={Wallet}
          tone="slate"
        />
      </div>

      <AdminPanel title="បញ្ជីសំណើសន្សំ" footer={
        <AdminPagination
          basePath="/admin/savings"
          page={page}
          hasPrev={hasPrev}
          hasNext={hasNext}
        />
      }>
        <SavingsList savings={savingRows} />
      </AdminPanel>
    </main>
  )
}
