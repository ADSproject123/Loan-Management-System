import { createAdminClient } from '@/lib/supabase/admin'
import { getInterestSettings } from '@/lib/interest'
import { SavingInterestDueView } from '@/app/admin/savings/SavingInterestDueView'

export default async function AdminSavingInterestDuePage() {
  const admin = createAdminClient()
  const todayIso = new Date().toISOString().slice(0, 10)
  const currentYear = Number(todayIso.slice(0, 4))
  const currentMonth = Math.min(12, Math.max(1, Number(todayIso.slice(5, 7)) || 1))

  const interestSettings = await getInterestSettings()

  const [{ data: savings }, { data: interestPayments }] = await Promise.all([
    admin
      .from('savings')
      .select(
        'id, member_id, amount, currency, status, saving_date, verified_at, verified_by, members:members!savings_member_id_fkey(full_name, full_name_kh, full_name_en, phone)'
      )
      .order('saving_date', { ascending: true }),
    admin
      .from('saving_interest_payments')
      .select('id, member_id, period_year, period_month, status'),
  ])

  return (
    <SavingInterestDueView
      savings={savings ?? []}
      interestPayments={interestPayments ?? []}
      monthlySavingInterestRate={interestSettings.monthlySavingInterestRate}
      asOfDate={todayIso}
      currentYear={currentYear}
      currentMonth={currentMonth}
    />
  )
}
