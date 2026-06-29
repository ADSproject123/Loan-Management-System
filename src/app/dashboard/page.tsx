import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { StatsTable, type StatsRow } from '@/components/ui/StatsTable'
import { AlertBanner } from '@/components/ui/AlertBanner'
import { MemberStatusBadge } from '@/components/ui/Badge'
import { requireMember } from '@/lib/auth/member'
import { createAdminClient } from '@/lib/supabase/admin'
import { formatMoney, normalizeCurrency, predominantCurrency } from '@/lib/currency'
import { getInterestSettings, monthlySavingInterest } from '@/lib/interest'
import { getLoanEligibility, sumCommittedLoanPrincipal } from '@/lib/loanEligibility'
import { toNumber } from '@/lib/utils'
import { formatKhmerDate, formatKhmerMonthYear } from '@/lib/dates'
import {
  PiggyBank,
  CreditCard,
  Wallet,
  TrendingUp,
  ArrowRight,
  ChevronRight,
  CheckCircle,
} from 'lucide-react'

const STATUS_LABELS: Record<string, string> = {
  pending: 'រង់ចាំ',
  verified: 'បានទទួល',
  completed: 'បានទទួល',
  active: 'សកម្ម',
  approved: 'បានទទួលយក',
  rejected: 'បានបដិសេធ',
  suspended: 'ផ្អាក',
  withdrawn: 'បានដក',
  under_review: 'កំពុងពិនិត្យ',
  sent: 'បានផ្ញើ',
  failed: 'បរាជ័យ',
}

function translateStatus(status: string) {
  return STATUS_LABELS[status] ?? status
}

export default async function DashboardPage() {
  const member = await requireMember()
  const admin = createAdminClient()

  const [savingsResult, loansResult, repaymentsResult] = await Promise.all([
    admin
      .from('savings')
      .select('id, amount, currency, saving_date, status, verified_at, verified_by, created_at')
      .eq('member_id', member.id)
      .order('created_at', { ascending: false })
      .limit(5),
    admin
      .from('loans')
      .select('id, amount, currency, purpose, status, created_at')
      .eq('member_id', member.id)
      .order('created_at', { ascending: false }),
    admin
      .from('loan_repayments')
      .select('id, amount, currency, payment_date, status, created_at')
      .eq('member_id', member.id)
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  const savings = savingsResult.data ?? []
  const loans = loansResult.data ?? []
  const repayments = repaymentsResult.data ?? []
  const effectiveSavingStatus = (saving: { status: string; verified_at?: string | null; verified_by?: string | null }) =>
    saving.verified_at || saving.verified_by ? 'completed' : saving.status

  const verifiedSavings = savings.filter((saving) => {
    const status = effectiveSavingStatus(saving)
    return status === 'verified' || status === 'completed'
  })
  const interestSettings = await getInterestSettings()
  const totalSavings = verifiedSavings.reduce((sum, saving) => sum + toNumber(saving.amount), 0)
  const monthlyInterest = monthlySavingInterest(totalSavings, interestSettings.monthlySavingInterestRate)
  const activeLoans = loans.filter((loan) => loan.status === 'active')
  const activeLoanAmount = activeLoans.reduce((sum, loan) => sum + toNumber(loan.amount), 0)
  const loanEligibility = getLoanEligibility(totalSavings, sumCommittedLoanPrincipal(loans))
  const availableCredit = loanEligibility.availableLoanAmount
  const savingsCurrency = predominantCurrency(verifiedSavings)
  const loanCurrency = predominantCurrency(activeLoans)
  const activity = [
    ...savings.map((saving) => ({
      id: `saving-${saving.id}`,
      type: 'saving',
      description: 'បានដាក់ស្នើការសន្សំ',
      amount: toNumber(saving.amount),
      currency: saving.currency ?? 'USD',
      date: saving.saving_date,
      status: effectiveSavingStatus(saving),
    })),
    ...repayments.map((repayment) => ({
      id: `repayment-${repayment.id}`,
      type: 'loan_repay',
      description: 'បានដាក់ស្នើការសងកម្ជី',
      amount: toNumber(repayment.amount),
      currency: repayment.currency ?? 'USD',
      date: repayment.payment_date,
      status: repayment.status,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5)

  const statsRows: StatsRow[] = [
    {
      icon: PiggyBank,
      iconClass: 'bg-green-100 text-green-700',
      label: 'ការសន្សំសរុប',
      value: formatMoney(totalSavings, savingsCurrency),
      meta: `+${formatMoney(monthlyInterest, savingsCurrency)} ខែនេះ`,
      metaClass: 'text-green-600 font-medium',
      href: '/dashboard/savings',
      linkLabel: 'មើលលម្អិត',
    },
    {
      icon: TrendingUp,
      iconClass: 'bg-brand-100 text-brand-700',
      label: 'ការប្រាក់ប្រចាំខែ',
      value: formatMoney(monthlyInterest, savingsCurrency),
      meta: `${interestSettings.monthlySavingInterestRate}% ក្នុងមួយខែ`,
      metaClass: 'text-brand-600 font-medium',
      href: null,
      linkLabel: null,
    },
    {
      icon: CreditCard,
      iconClass: 'bg-orange-100 text-orange-700',
      label: 'កម្ជីសកម្ម',
      value: formatMoney(activeLoanAmount, loanCurrency),
      meta: null,
      metaClass: '',
      href: '/dashboard/loans',
      linkLabel: 'មើលលម្អិត',
    },
    {
      icon: Wallet,
      iconClass: 'bg-purple-100 text-purple-700',
      label: 'កម្ជីដែលអាចស្នើសុំបាន',
      value: formatMoney(availableCredit, savingsCurrency),
      meta: null,
      metaClass: '',
      href: loanEligibility.canRequestLoan ? '/dashboard/loans/request' : '/dashboard/savings/add',
      linkLabel: loanEligibility.canRequestLoan ? 'ស្នើសុំកម្ជី' : 'ដាក់ស្នើការសន្សំជាមុន',
    },
  ]

  return (
    <div className="mx-auto max-w-7xl p-6 md:p-10">
      <div className="mb-8">
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
          សូមស្វាគមន៍, {member.full_name.split(' ')[0]}
        </h1>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-500">
          <span>
            សមាជិកតាំងពី{' '}
            {formatKhmerMonthYear(member.joined_at)}
          </span>
          <span className="text-slate-300">·</span>
          <MemberStatusBadge status={member.status} />
        </div>
      </div>     

      {/* Stats Table */}
      <StatsTable rows={statsRows} className="mb-8" />

      {/* Two Column Layout */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="lg:col-span-1">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">សកម្មភាពរហ័ស</h2>
          <div className="space-y-3">
            {[
              {
                href: '/dashboard/savings/add',
                icon: PiggyBank,
                label: 'ស្នើសុំការសន្សំ',
                description: 'កត់ត្រាការបរិច្ចាគប្រចាំខែរបស់អ្នក',
                color: 'bg-green-50 text-green-700',
              },
              {
                href: '/dashboard/loans/request',
                icon: CreditCard,
                label: 'ស្នើសុំកម្ជី',
                description: 'ដាក់ពាក្យសុំកម្ជីសមាជិក',
                color: 'bg-brand-50 text-brand-700',
              },
              {
                href: '/dashboard/loans/repay',
                icon: ArrowRight,
                label: 'សងកម្ជី',
                description: 'បង់ប្រាក់កម្ជីបន្តិចម្តងៗ',
                color: 'bg-orange-50 text-orange-700',
              },
              {
                href: '/dashboard/capital',
                icon: Wallet,
                label: 'ស្នើសុំដើមទុន',
                description: 'ស្នើសុំដកការសន្សំ',
                color: 'bg-purple-50 text-purple-700',
              },
            ].map((action) => {
              const Icon = action.icon
              return (
                <Link
                  key={action.href}
                  href={action.href}
                  className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-200 hover:border-brand-300 hover:shadow-sm transition-all group"
                >
                  <div className={`p-2.5 rounded-lg flex-shrink-0 ${action.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 text-sm">{action.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{action.description}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-brand-500 transition-colors" />
                </Link>
              )
            })}
          </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Activity */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">សកម្មភាពថ្មីៗ</h2>
              <Link href="/dashboard/savings" className="text-brand-700 text-sm hover:text-brand-900 transition-colors">
                មើលទាំងអស់
              </Link>
            </div>
            <Card padding="none">
              <div className="divide-y divide-gray-100">
                {activity.length === 0 && (
                  <div className="p-4 text-sm text-gray-500">មិនទាន់មានសកម្មភាពនៅឡើយ។</div>
                )}
                {activity.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 p-4">
                    <div className={`p-2 rounded-lg flex-shrink-0 ${
                      item.type === 'saving' ? 'bg-green-100' :
                      item.type === 'loan_repay' ? 'bg-orange-100' :
                      'bg-brand-100'
                    }`}>
                      {item.type === 'saving' ? (
                        <PiggyBank className="w-4 h-4 text-green-700" />
                      ) : item.type === 'loan_repay' ? (
                        <CreditCard className="w-4 h-4 text-orange-700" />
                      ) : (
                        <TrendingUp className="w-4 h-4 text-brand-700" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{item.description}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{formatKhmerDate(item.date)}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-semibold ${item.type === 'loan_repay' ? 'text-orange-600' : 'text-green-600'}`}>
                        {item.type === 'loan_repay' ? '-' : '+'}{formatMoney(item.amount, normalizeCurrency(item.currency))}
                      </p>
                      <div className="flex items-center gap-1 justify-end mt-0.5">
                        <CheckCircle className="w-3 h-3 text-green-500" />
                        <span className="text-xs text-gray-400">{translateStatus(item.status)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Important Notice */}
      <AlertBanner variant="info" className="mt-8">
        <div>
          <p className="text-yellow-900 font-semibold text-sm">អំឡុងពេលដកដើមទុន</p>
          <p className="text-yellow-700 text-sm mt-1">
            ការស្នើសុំដកដើមទុនត្រូវបានទទួលយកតែក្នុងអំឡុង ថ្ងៃទី ២០-២៥ មករា ប្រចាំឆ្នាំ។
            ប្រសិនបើអ្នកមានគម្រោងដកដើមទុនសន្សំរបស់អ្នក សូមដាក់ស្នើពាក្យសុំក្នុងអំឡុងពេលនេះ។
          </p>
          <Link href="/dashboard/capital" className="inline-flex items-center gap-1 text-yellow-800 text-sm font-medium mt-2 hover:text-yellow-900 transition-colors">
            ស្វែងយល់អំពីការស្នើសុំដើមទុន <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </AlertBanner>
    </div>
  )
}
