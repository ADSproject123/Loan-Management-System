import { createAdminClient } from '@/lib/supabase/admin'
import { SavingsList } from '@/app/admin/savings/SavingsList'
import { AdminPanel } from '@/components/admin'

export default async function AdminSavingsLedgerPage() {
  const admin = createAdminClient()

  const { data } = await admin
    .from('savings')
    .select(
      'id, member_id, amount, currency, status, evidence_url, qr_code_ref, saving_date, created_at, members:members!savings_member_id_fkey(full_name, email)'
    )
    .order('created_at', { ascending: false })

  return (
    <main>
      <AdminPanel title="បញ្ជីការសន្សំទាំងអស់">
        <SavingsList savings={data ?? []} mode="ledger" />
      </AdminPanel>
    </main>
  )
}
