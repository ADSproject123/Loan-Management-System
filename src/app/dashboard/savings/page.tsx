import { dataTable, tableContainer, tableScroll } from '@/components/ui/tableStyles'
import { SavingStatusBadge } from '@/components/ui/Badge'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatsTable, type StatsRow } from '@/components/ui/StatsTable'
import { Button } from '@/components/ui/Button'
import { requireMember } from '@/lib/auth/member'
import { createAdminClient } from '@/lib/supabase/admin'
import { formatMoney, predominantCurrency } from '@/lib/currency'
import { formatKhmerDate } from '@/lib/dates'
import { getInterestSettings, monthlySavingInterestForCombinedSavings } from '@/lib/interest'
import { toNumber } from '@/lib/utils'
import { PiggyBank, Plus, TrendingUp, ChevronRight } from 'lucide-react'

export default async function SavingsPage() {
  const member = await requireMember()
  const admin = createAdminClient()
  const { data } = await admin
    .from('savings')
    .select('id, amount, currency, saving_date, status, notes, refund_reason, verified_at, verified_by')
    .eq('member_id', member.id)
    .order('saving_date', { ascending: false })

  const savings = data ?? []
  const effectiveStatus = (saving: {
    status: string
    verified_at?: string | null
    verified_by?: string | null
  }) => {
    if (saving.status === 'refunded') return 'refunded' as const
    if (saving.verified_at || saving.verified_by) return 'completed' as const
    return saving.status as 'pending' | 'verified' | 'completed'
  }

  const verifiedSavings = savings.filter((saving) => {
    const status = effectiveStatus(saving)
    return status === 'verified' || status === 'completed'
  })
  const interestSettings = await getInterestSettings()
  const totalSavings = verifiedSavings.reduce((sum, saving) => sum + toNumber(saving.amount), 0)
  const monthlyInterest = monthlySavingInterestForCombinedSavings(
    verifiedSavings,
    interestSettings.monthlySavingInterestRate
  )
  const displayCurrency = predominantCurrency(verifiedSavings)

  const statsRows: StatsRow[] = [
    {
      icon: PiggyBank,
      iconClass: 'bg-green-100 text-green-700',
      label: 'សមតុល្យសន្សំសរុប',
      value: formatMoney(totalSavings, displayCurrency),
    },
    {
      icon: TrendingUp,
      iconClass: 'bg-brand-100 text-brand-700',
      label: 'ការប្រាក់ប្រចាំខែ',
      value: formatMoney(monthlyInterest, displayCurrency),
      meta: `${interestSettings.monthlySavingInterestRate}% លើសមតុល្យសរុប`,
      metaClass: 'text-brand-600 font-medium',
    },
    {
      icon: ChevronRight,
      iconClass: 'bg-purple-100 text-purple-700',
      label: 'ការបរិច្ចាគសរុប',
      value: String(savings.length),
    },
  ]

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <PageHeader title="ការសន្សំរបស់ខ្ញុំ" subtitle="តាមដានការបរិច្ចាគប្រចាំខែ និង ការប្រាក់របស់អ្នក">
        <Button href="/dashboard/savings/add" size="sm">
          <Plus className="w-4 h-4" />
          បន្ថែមការសន្សំ
        </Button>
      </PageHeader>

      <StatsTable rows={statsRows} className="mb-8" />

      {/* Savings History */}
      <div className={tableContainer}>
        <div className={dataTable.sectionHeader}>
          <h2 className={dataTable.sectionTitle}>ប្រវត្តិការសន្សំ</h2>
        </div>
        <div className={tableScroll}>
          <table className={dataTable.table}>
            <thead className={dataTable.thead}>
              <tr className={dataTable.thRow}>
                <th className={dataTable.th}>កាលបរិច្ឆេទ</th>
                <th className={dataTable.th}>ចំនួនទឹកប្រាក់</th>
                <th className={dataTable.th}>កំណត់ចំណាំ</th>
                <th className={dataTable.th}>ស្ថានភាព</th>
              </tr>
            </thead>
            <tbody className={dataTable.tbody}>
              {savings.length === 0 && (
                <tr>
                  <td colSpan={4} className={dataTable.emptyCell}>
                    មិនទាន់មានការសន្សំដែលបានដាក់ស្នើនៅឡើយ។
                  </td>
                </tr>
              )}
              {savings.map((saving) => (
                <tr key={saving.id} className={dataTable.tr}>
                  <td className={dataTable.td}>
                    {formatKhmerDate(saving.saving_date)}
                  </td>
                  <td className={dataTable.td}>
                    <span className="font-semibold text-green-700">+{formatMoney(saving.amount, saving.currency ?? 'USD')}</span>
                  </td>
                  <td className={dataTable.tdMuted}>
                    {saving.status === 'refunded' && saving.refund_reason
                      ? saving.refund_reason
                      : saving.notes || '—'}
                  </td>
                  <td className={dataTable.td}>
                    <SavingStatusBadge status={effectiveStatus(saving)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
