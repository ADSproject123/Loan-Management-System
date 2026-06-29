import { Card } from '@/components/ui/Card'
import { SavingStatusBadge } from '@/components/ui/Badge'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatsTable, type StatsRow } from '@/components/ui/StatsTable'
import { Button } from '@/components/ui/Button'
import { requireMember } from '@/lib/auth/member'
import { createAdminClient } from '@/lib/supabase/admin'
import { formatMoney, predominantCurrency } from '@/lib/currency'
import { formatKhmerDate } from '@/lib/dates'
import { getInterestSettings, monthlySavingInterest } from '@/lib/interest'
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
  const monthlyInterest = monthlySavingInterest(totalSavings, interestSettings.monthlySavingInterestRate)
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
      meta: `${interestSettings.monthlySavingInterestRate}% ក្នុងមួយខែ`,
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
      <Card padding="none">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">ប្រវត្តិការសន្សំ</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">កាលបរិច្ឆេទ</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">ចំនួនទឹកប្រាក់</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">កំណត់ចំណាំ</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">ស្ថានភាព</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {savings.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-sm text-gray-500">
                    មិនទាន់មានការសន្សំដែលបានដាក់ស្នើនៅឡើយ។
                  </td>
                </tr>
              )}
              {savings.map((saving) => (
                <tr key={saving.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {formatKhmerDate(saving.saving_date)}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-semibold text-green-700">+{formatMoney(saving.amount, saving.currency ?? 'USD')}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {saving.status === 'refunded' && saving.refund_reason
                      ? saving.refund_reason
                      : saving.notes || '—'}
                  </td>
                  <td className="px-6 py-4">
                    <SavingStatusBadge status={effectiveStatus(saving)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
