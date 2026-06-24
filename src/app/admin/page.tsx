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
import { CommunityBalanceCircle } from '@/app/admin/CommunityBalanceCircle'
import { AdminPanel } from '@/components/admin'
import { getInterestSettings } from '@/lib/interest'
import { computeCommunityBalance } from '@/lib/admin/communityBalance'

export default async function AdminPage() {
  const admin = createAdminClient()
  const todayIso = new Date().toISOString().slice(0, 10)
  const interestSettings = await getInterestSettings()

  const [
    membersActive,
    membersPendingCount,
    allSavings,
    allLoans,
    activeLoans,
    activeLoansForInterest,
    loanRepayments,
    completedRepayments,
    loansTotalCount,
    loansActiveCount,
  ] = await Promise.all([
    admin.from('members').select('id', { count: 'exact', head: true }).eq('is_admin', false).eq('status', 'active'),
    admin.from('members').select('id', { count: 'exact', head: true }).eq('is_admin', false).eq('status', 'pending'),
    admin
      .from('savings')
      .select('id, member_id, amount, currency, status, verified_at, verified_by, saving_date, created_at'),
    admin
      .from('loans')
      .select('amount, currency, status, disbursed_at, approved_at, start_date, created_at'),
    admin.from('loans').select('amount, currency').eq('status', 'active'),
    admin
      .from('loans')
      .select(
        'id, member_id, amount, currency, term_months, monthly_interest_rate, start_date, disbursed_at, created_at, status'
      )
      .in('status', ['active', 'approved']),
    admin.from('loan_repayments').select('loan_id, amount, status'),
    admin.from('loan_repayments').select('amount, currency').eq('status', 'completed'),
    admin.from('loans').select('id', { count: 'exact', head: true }),
    admin.from('loans').select('id', { count: 'exact', head: true }).eq('status', 'active'),
  ])

  const savingsRows = (allSavings.data ?? []) as SavingChartSourceRow[]
  const savingsInterestRows = allSavings.data ?? []
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
  const verifiedSavingsMemberCount = new Set(
    (allSavings.data ?? [])
      .filter((row) => isVerifiedSavingForChart(row as SavingChartSourceRow))
      .map((row) => row.member_id)
  ).size

  const balanceLoans = (activeLoansForInterest.data ?? []).filter(
    (loan) => loan.status === 'active' || loan.status === 'approved'
  )
  const communityBalance = computeCommunityBalance(
    savingsRows,
    balanceLoans,
    loanRepayments.data ?? [],
    interestSettings.monthlySavingInterestRate,
    interestSettings.monthlyLoanInterestRate
  )

  const overviewStats = (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-xl border border-border bg-surface-muted/20">
        <CommunityBalanceCircle
          netTotal={communityBalance.netTotal}
          savingsTotal={communityBalance.savingsTotal}
          accruedInterest={communityBalance.accruedInterest}
          loanRemaining={communityBalance.loanRemaining}
          memberCount={verifiedSavingsMemberCount}
          savingsCount={verifiedSavingsCount}
        />
      </div>

      <div className="overflow-hidden rounded-xl border border-border">
      <table className="w-full text-sm">
        <thead className="border-b border-border bg-surface-muted/50">
          <tr>
            <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-foreground">ប្រភេទ</th>
            <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-foreground">តម្លៃ</th>
            <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-foreground">ព័ត៌មានបន្ថែម</th>
            <th className="px-5 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          <tr className="bg-surface hover:bg-surface-muted/40">
            <td className="px-5 py-4 text-sm font-semibold text-muted">សមាជិកសកម្ម</td>
            <td className="px-5 py-4 text-sm font-bold tabular-nums text-foreground">{activeMembers}</td>
            <td className="px-5 py-4 text-sm text-muted">រង់ចាំចូលរួម <span className="font-semibold text-foreground">{pendingMemberTotal}</span></td>
            <td className="px-5 py-4 text-right"><Link href="/admin/members" className="text-xs font-semibold text-brand-700 hover:text-brand-900">មើល →</Link></td>
          </tr>
          <tr className="bg-surface hover:bg-surface-muted/40">
            <td className="px-5 py-4 text-sm font-semibold text-muted">កម្ជីទាំងអស់</td>
            <td className="px-5 py-4 text-sm font-bold tabular-nums text-foreground">{totalLoans}</td>
            <td className="px-5 py-4 text-sm text-muted">សកម្ម <span className="font-semibold text-foreground">{activeLoansCount}</span> កម្ជី</td>
            <td className="px-5 py-4 text-right"><Link href="/admin/loans" className="text-xs font-semibold text-brand-700 hover:text-brand-900">មើល →</Link></td>
          </tr>
          <tr className="bg-surface hover:bg-surface-muted/40">
            <td className="px-5 py-4 text-sm font-semibold text-muted">សន្សំសរុប</td>
            <td className="px-5 py-4 text-sm font-bold tabular-nums text-foreground">{money(verifiedSavingsTotal)}</td>
            <td className="px-5 py-4 text-sm text-muted">ផ្ទៀងផ្ទាត់ <span className="font-semibold text-foreground">{verifiedSavingsCount}</span> ដំណើរ</td>
            <td className="px-5 py-4 text-right"><Link href="/admin/savings" className="text-xs font-semibold text-brand-700 hover:text-brand-900">មើល →</Link></td>
          </tr>
          <tr className="bg-surface hover:bg-surface-muted/40">
            <td className="px-5 py-4 text-sm font-semibold text-muted">កម្ជីសកម្ម</td>
            <td className="px-5 py-4 text-sm font-bold tabular-nums text-foreground">{money(activeLoanTotal)}</td>
            <td className="px-5 py-4 text-sm text-muted">ផលប័ត្រ <span className="font-semibold text-foreground">{money(loanPortfolioTotal)}</span></td>
            <td className="px-5 py-4 text-right"><Link href="/admin/loans/active" className="text-xs font-semibold text-brand-700 hover:text-brand-900">មើល →</Link></td>
          </tr>
          <tr className="bg-surface hover:bg-surface-muted/40">
            <td className="px-5 py-4 text-sm font-semibold text-muted">ប្រាក់សងសរុប</td>
            <td className="px-5 py-4 text-sm font-bold tabular-nums text-foreground">{money(repaymentTotal)}</td>
            <td className="px-5 py-4 text-sm text-muted" />
            <td className="px-5 py-4 text-right"><Link href="/admin/loans/payments" className="text-xs font-semibold text-brand-700 hover:text-brand-900">មើល →</Link></td>
          </tr>
        </tbody>
      </table>
      </div>
    </div>
  )

  return (
    <main className="flex min-h-screen flex-col">
      <AdminPanel title="ផ្ទាំងគ្រប់គ្រង">
        <div className="flex min-h-0 flex-1 flex-col px-6 py-6 md:px-8">
          <DashboardCharts
            overview={overviewStats}
            portfolioData={portfolioPieData}
            savingsRows={savingsRows}
            loanRows={loanRows}
            savingsInterestRows={savingsInterestRows}
            activeLoanRows={(activeLoansForInterest.data ?? []).filter((loan) => loan.status === 'active')}
            loanRepaymentRows={loanRepayments.data ?? []}
            monthlySavingInterestRate={interestSettings.monthlySavingInterestRate}
            monthlyLoanInterestRate={interestSettings.monthlyLoanInterestRate}
            asOfDate={todayIso}
            defaultFromKey={defaultFromKey}
            defaultToKey={defaultToKey}
          />
        </div>
      </AdminPanel>
    </main>
  )
}
