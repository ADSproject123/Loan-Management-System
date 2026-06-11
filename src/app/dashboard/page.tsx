import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { MemberStatusBadge } from '@/components/ui/Badge'
import { requireMember } from '@/lib/auth/member'
import { createAdminClient } from '@/lib/supabase/admin'
import { currencySymbol, predominantCurrency } from '@/lib/currency'
import { getInterestSettings, monthlySavingInterest } from '@/lib/interest'
import { getLoanEligibility, sumCommittedLoanPrincipal } from '@/lib/loanEligibility'
import {
  PiggyBank,
  CreditCard,
  Wallet,
  TrendingUp,
  ArrowRight,
  Bell,
  Calendar,
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  Clock,
} from 'lucide-react'

function toNumber(value: unknown) {
  const numberValue = Number(value ?? 0)
  return Number.isFinite(numberValue) ? numberValue : 0
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('km-KH', { day: 'numeric', month: 'short', year: 'numeric' })
}

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

  const [savingsResult, loansResult, repaymentsResult, notificationsResult] = await Promise.all([
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
    admin
      .from('notifications')
      .select('id, title, message, read, created_at')
      .eq('member_id', member.id)
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  const savings = savingsResult.data ?? []
  const loans = loansResult.data ?? []
  const repayments = repaymentsResult.data ?? []
  const notifications = notificationsResult.data ?? []
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
  const savingsSymbol = currencySymbol(predominantCurrency(verifiedSavings))
  const loanSymbol = currencySymbol(predominantCurrency(activeLoans))
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

  return (
    <div className="mx-auto max-w-7xl p-6 md:p-10">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-brand-700">វិបផតថលសមាជិក</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">
            សូមស្វាគមន៍, {member.full_name.split(' ')[0]}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-500">
            <span>
              សមាជិកតាំងពី{' '}
              {new Date(member.joined_at).toLocaleDateString('km-KH', { month: 'long', year: 'numeric' })}
            </span>
            <span className="text-slate-300">·</span>
            <MemberStatusBadge status={member.status} />
          </div>
        </div>
        <Link
          href="/dashboard/notifications"
          className="relative grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-slate-200/80 bg-white shadow-sm transition hover:border-brand-200 hover:shadow"
        >
          <Bell className="h-5 w-5 text-slate-600" />
          {notifications.some((notification) => !notification.read) && (
            <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white" />
          )}
        </Link>
      </div>

      <div className="mb-8 flex flex-col gap-4 app-hero-banner p-5 sm:flex-row sm:items-center sm:justify-between md:p-6">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white/15 ring-1 ring-white/20">
            <Calendar className="h-5 w-5 text-brand-100" />
          </span>
          <div>
            <p className="font-semibold">ដល់ពេលសន្សំខែនេះ</p>
            <p className="text-sm text-brand-100/90">បន្ថែមការសន្សំប្រចាំខែមុនផុតកំណត់</p>
          </div>
        </div>
        <Link
          href="/dashboard/savings/add"
          className="inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-brand-900 shadow-sm transition hover:bg-brand-50"
        >
          បន្ថែមឥឡូវនេះ <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
        <Card className="col-span-2 sm:col-span-1">
          <div className="flex items-start justify-between mb-3">
            <div className="p-2.5 bg-green-100 rounded-lg">
              <PiggyBank className="w-5 h-5 text-green-700" />
            </div>
            <TrendingUp className="w-4 h-4 text-green-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{savingsSymbol}{totalSavings.toLocaleString()}</p>
          <p className="text-gray-500 text-sm mt-1">ការសន្សំសរុប</p>
          <p className="text-green-600 text-xs mt-2 font-medium">+{savingsSymbol}{monthlyInterest.toLocaleString()} ខែនេះ</p>
        </Card>

        <Card>
          <div className="p-2.5 bg-brand-100 rounded-lg inline-flex mb-3">
            <TrendingUp className="w-5 h-5 text-brand-700" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{savingsSymbol}{monthlyInterest.toLocaleString()}</p>
          <p className="text-gray-500 text-sm mt-1">ការប្រាក់ប្រចាំខែ</p>
          <p className="text-brand-600 text-xs mt-2 font-medium">{interestSettings.monthlySavingInterestRate}% ក្នុងមួយខែ</p>
        </Card>

        <Card>
          <div className="p-2.5 bg-orange-100 rounded-lg inline-flex mb-3">
            <CreditCard className="w-5 h-5 text-orange-700" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{loanSymbol}{activeLoanAmount.toLocaleString()}</p>
          <p className="text-gray-500 text-sm mt-1">កម្ជីសកម្ម</p>
          <Link href="/dashboard/loans" className="text-orange-600 text-xs mt-2 font-medium hover:text-orange-700 inline-flex items-center gap-1">
            មើលលម្អិត <ChevronRight className="w-3 h-3" />
          </Link>
        </Card>

        <Card>
          <div className="p-2.5 bg-purple-100 rounded-lg inline-flex mb-3">
            <Wallet className="w-5 h-5 text-purple-700" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{savingsSymbol}{availableCredit.toLocaleString()}</p>
          <p className="text-gray-500 text-sm mt-1">កម្ជីដែលអាចស្នើសុំបាន</p>
          <Link
            href={loanEligibility.canRequestLoan ? '/dashboard/loans/request' : '/dashboard/savings/add'}
            className="text-purple-600 text-xs mt-2 font-medium hover:text-purple-700 inline-flex items-center gap-1"
          >
            {loanEligibility.canRequestLoan ? 'ស្នើសុំកម្ជី' : 'ដាក់ស្នើការសន្សំជាមុន'} <ChevronRight className="w-3 h-3" />
          </Link>
        </Card>
      </div>

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
                      <p className="text-xs text-gray-400 mt-0.5">{formatDate(item.date)}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-semibold ${item.type === 'loan_repay' ? 'text-orange-600' : 'text-green-600'}`}>
                        {item.type === 'loan_repay' ? '-' : '+'}{currencySymbol(item.currency)}{item.amount.toLocaleString()}
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

          {/* Notifications */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">ការជូនដំណឹង</h2>
              <button className="rounded-lg bg-brand-50 px-3 py-1.5 text-sm font-medium text-brand-700 transition hover:bg-brand-100 hover:text-brand-900">
                សម្គាល់ថាអានទាំងអស់
              </button>
            </div>
            <div className="space-y-3">
              {notifications.length === 0 && (
                <div className="p-4 rounded-xl border bg-white border-gray-200 text-sm text-gray-500">
                  មិនទាន់មានការជូនដំណឹងនៅឡើយ។
                </div>
              )}
              {notifications.map((notif) => (
                <div key={notif.id} className={`p-4 rounded-xl border ${notif.read ? 'bg-white border-gray-200' : 'bg-brand-50 border-brand-200'}`}>
                  <div className="flex items-start gap-3">
                    <div className={`p-1.5 rounded-full flex-shrink-0 ${notif.read ? 'bg-gray-100' : 'bg-brand-100'}`}>
                      {notif.read ? (
                        <CheckCircle className="w-4 h-4 text-gray-400" />
                      ) : (
                        <Bell className="w-4 h-4 text-brand-700" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className={`text-sm font-medium ${notif.read ? 'text-gray-700' : 'text-brand-900'}`}>{notif.title}</p>
                        <div className="flex items-center gap-1 text-gray-400 flex-shrink-0">
                          <Clock className="w-3 h-3" />
                          <span className="text-xs">{formatDate(notif.created_at)}</span>
                        </div>
                      </div>
                      <p className={`text-sm mt-1 ${notif.read ? 'text-gray-500' : 'text-brand-700'}`}>{notif.message}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Important Notice */}
      <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-xl p-5 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
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
      </div>
    </div>
  )
}
