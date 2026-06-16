import { createAdminClient } from '@/lib/supabase/admin'
import { LoansList } from '@/app/admin/loans/LoansList'
import { AdminPanel } from '@/components/admin'

export default async function AdminLoansLedgerPage() {
  const admin = createAdminClient()

  const { data } = await admin
    .from('loans')
    .select(
      'id, member_id, amount, currency, purpose, status, created_at, due_date, disbursed_at, members:members!loans_member_id_fkey(full_name, email)'
    )
    .order('created_at', { ascending: false })

  return (
    <main>
      <AdminPanel title="បញ្ជីកម្ជីទាំងអស់">
        <LoansList loans={data ?? []} variant="all" mode="ledger" />
      </AdminPanel>
    </main>
  )
}
