import Link from 'next/link'
import { format, startOfMonth, subMonths } from 'date-fns'
import { createAdminClient } from '@/lib/supabase/admin'
import { money, sumAmounts } from '@/app/admin/adminUtils'
import {
  isVerifiedSavingForChart,
  type SavingChartSourceRow,
} from '@/lib/admin/savingsChartData'
import { type LoanChartSourceRow } from '@/lib/admin/loanChartData'
import { DashboardCharts } from '@/app/admin/DashboardCharts'
import { AdminPanel, AdminStatCard } from '@/components/admin'
import { CreditCard, Landmark, PiggyBank, Users, Wallet } from 'lucide-react'

export default async function AdminPage() {
  const admin = createAdminClient()

  const [
    membersActive,
    membersPendingCount,
    allSavings,
    allLoans,
    activeLoans,
    completedRepayments,
    loansTotalCount,
    loansActiveCount,
  ] = await Promise.all([
    admin.from('members').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    admin.from('members').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    admin
      .from('savings')
      .select('amount, currency, status, verified_at, verified_by, saving_date, created_at'),
    admin
      .from('loans')
      .select('amount, currency, status, disbursed_at, approved_at, start_date, created_at'),
    admin.from('loans').select('amount, currency').eq('status', 'active'),
    admin.from('loan_repayments').select('amount, currency').eq('status', 'completed'),
    admin.from('loans').select('id', { count: 'exact', head: true }),
    admin.from('loans').select('id', { count: 'exact', head: true }).eq('status', 'active'),
  ])

  const savingsRows = (allSavings.data ?? []) as SavingChartSourceRow[]
  const verifiedSavings = savingsRows.filter(isVerifiedSavingForChart)
  const verifiedSavingsTotal = sumAmounts(verifiedSavings)
  const activeLoanTotal = sumAmounts(activeLoans.data ?? [])
  const repaymentTotal = sumAmounts(completedRepayments.data ?? [])
  const loanRows = (allLoans.data ?? []) as LoanChartSourceRow[]
  const loanPortfolioTotal = sumAmounts(
    loanRows.filter((loan) => loan.status === 'active' || loan.status === 'approved')
  )

  const anchorMonth = startOfMonth(new Date())
  const defaultToKey = format(anchorMonth, 'yyyy-MM')
  const defaultFromKey = format(subMonths(anchorMonth, 11), 'yyyy-MM')

  const portfolioPieData = [
    { label: 'សន្សំសរុប', value: verifiedSavingsTotal, color: '#10b981' },
    { label: 'កម្ជីសកម្ម', value: activeLoanTotal, color: '#f59e0b' },
    { label: 'ប្រាក់សងសរុប', value: repaymentTotal, color: '#1e3a8a' },
  ]

  const activeMembers = membersActive.count ?? 0
  const pendingMemberTotal = membersPendingCount.count ?? 0
  const totalLoans = loansTotalCount.count ?? 0
  const activeLoansCount = loansActiveCount.count ?? 0
  const verifiedSavingsCount = verifiedSavings.length

  const overviewStats = (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 *:h-full">
        <AdminStatCard
          label="សមាជិកសកម្ម"
          value={activeMembers}
          subtitle={
            <>
              រង់ចាំចូលរួម{' '}
              <span className="font-semibold tabular-nums">{pendingMemberTotal}</span>
            </>
          }
          icon={Users}
          tone="blue"
        />
        <Link href="/admin/loans" className="block h-full transition hover:opacity-95">
          <AdminStatCard label="កម្ជីទាំងអស់" value={totalLoans} icon={CreditCard} tone="slate" />
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 *:h-full">
        <Link href="/admin/savings" className="block h-full transition hover:opacity-95">
          <AdminStatCard
            label="សន្សំសរុប"
            value={money(verifiedSavingsTotal)}
            icon={PiggyBank}
            tone="emerald"
          />
        </Link>
        <Link href="/admin/loans/active" className="block h-full transition hover:opacity-95">
          <AdminStatCard
            label="កម្ជីសកម្ម"
            value={money(activeLoanTotal)}
            subtitle={
              <>
                ចំនួន{' '}
                <span className="font-semibold tabular-nums">{activeLoansCount}</span> កម្ជី
              </>
            }
            icon={Landmark}
            tone="amber"
          />
        </Link>
        <Link href="/admin/loans/payments" className="block h-full transition hover:opacity-95">
          <AdminStatCard
            label="ប្រាក់សងសរុប"
            value={money(repaymentTotal)}
            icon={Wallet}
            tone="blue"
          />
        </Link>
      </div>

      <p className="text-sm text-muted">
        ការសន្សំផ្ទៀងផ្ទាត់{' '}
        <span className="font-semibold text-foreground">{verifiedSavingsCount}</span> ដំណើរ ·
        កម្ជីបានទទួល/សកម្ម{' '}
        <span className="font-semibold text-foreground">{money(loanPortfolioTotal)}</span>{' '}
        (បានទទួល + សកម្ម)
      </p>
    </div>
  )

  return (
    <main className="flex min-h-screen flex-col">
      <AdminPanel title="ផ្ទាំងគ្រប់គ្រង" fill>
        <div className="flex min-h-0 flex-1 flex-col px-6 py-6 md:px-8">
          <DashboardCharts
            overview={overviewStats}
            portfolioData={portfolioPieData}
            savingsRows={savingsRows}
            loanRows={loanRows}
            defaultFromKey={defaultFromKey}
            defaultToKey={defaultToKey}
          />
        </div>
      </AdminPanel>
    </main>
  )
}
