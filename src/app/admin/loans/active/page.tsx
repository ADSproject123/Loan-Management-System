import { createAdminClient } from '@/lib/supabase/admin'
import { LoansList } from '@/app/admin/loans/LoansList'
import { AdminPanel } from '@/components/admin'

export default async function AdminActiveLoansPage() {
  const admin = createAdminClient()

  const { data } = await admin
    .from('loans')
    .select(
      'id, member_id, amount, currency, purpose, status, created_at, due_date, disbursed_at, members:members!loans_member_id_fkey(full_name, email)'
    )
    .eq('status', 'active')
    .order('disbursed_at', { ascending: false })

  return (
    <main>
      <AdminPanel title="កម្ជីកំពុងដំណើរការ">
        <LoansList loans={data ?? []} variant="active" mode="ledger" />
      </AdminPanel>
    </main>
  )
}
