import { createAdminClient } from '@/lib/supabase/admin'
import { SavingsList } from '@/app/admin/savings/SavingsList'

export default async function AdminSavingsLedgerPage() {
  const admin = createAdminClient()

  const { data } = await admin
    .from('savings')
    .select(
      'id, member_id, amount, currency, status, evidence_url, qr_code_ref, saving_date, created_at, members:members!savings_member_id_fkey(full_name, full_name_kh, full_name_en, email)'
    )
    .order('created_at', { ascending: false })

  return <SavingsList savings={data ?? []} mode="ledger" />
}
