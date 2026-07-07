import Link from 'next/link'
import { LoanStatusBadge } from '@/components/ui/Badge'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatsTable, type StatsRow } from '@/components/ui/StatsTable'
import { AlertBanner } from '@/components/ui/AlertBanner'
import { Button } from '@/components/ui/Button'
import { requireMember } from '@/lib/auth/member'
import { createAdminClient } from '@/lib/supabase/admin'
import { formatMoney, normalizeCurrency } from '@/lib/currency'
import { formatKhmerDate } from '@/lib/dates'
import { getInterestSettings } from '@/lib/interest'
import { getLoanEligibility, sumCommittedLoanPrincipal, sumVerifiedSavings } from '@/lib/loanEligibility'
import { buildMemberCombinedLoansContext } from '@/lib/loan/memberCombinedLoans'
import { dataTable, tableContainer, tableScroll } from '@/components/ui/tableStyles'
import { toNumber } from '@/lib/utils'
import { CreditCard, Plus, FileText, AlertTriangle, ArrowRight } from 'lucide-react'

export default async function LoansPage() {
  const member = await requireMember()
  const admin = createAdminClient()
  const [loansResult, repaymentsResult, savingsResult] = await Promise.all([
    admin
      .from('loans')
      .select('id, amount, currency, purpose, term_months, monthly_interest_rate, status, start_date, disbursed_at, due_date, created_at')
      .eq('member_id', member.id)
      .order('created_at', { ascending: false }),
    admin
      .from('loan_repayments')
      .select('loan_id, amount, status')
      .eq('member_id', member.id),
    admin
      .from('savings')
      .select('amount, status, verified_at, verified_by')
      .eq('member_id', member.id),
  ])

  const interestSettings = await getInterestSettings()
  const loans = loansResult.data ?? []
  const repayments = repaymentsResult.data ?? []

  const combinedActiveLoans = buildMemberCombinedLoansContext(
    member.id,
    loans.map((loan) => ({ ...loan, member_id: member.id, created_at: loan.created_at })),
    repayments,
    interestSettings.monthlyLoanInterestRate
  )

  const activeLoanPrincipal = combinedActiveLoans?.totalPrincipal ?? 0
  const activeLoanPaid = combinedActiveLoans?.totalPaid ?? 0
  const activeLoanTotalOwed = combinedActiveLoans?.totalOwed ?? 0
  const remaining = combinedActiveLoans?.totalRemaining ?? 0
  const hasActiveLoans = Boolean(combinedActiveLoans)
  const activeLoanCount = combinedActiveLoans?.loanCount ?? 0
  const totalSavings = sumVerifiedSavings(savingsResult.data ?? [])
  const loanEligibility = getLoanEligibility(totalSavings, sumCommittedLoanPrincipal(loans))
  const loanCurrency = combinedActiveLoans
    ? normalizeCurrency(combinedActiveLoans.currency)
    : 'USD'
  const paidPercent = activeLoanTotalOwed > 0 ? Math.round((activeLoanPaid / activeLoanTotalOwed) * 100) : 0

  const statsRows: StatsRow[] = [
    {
      icon: CreditCard,
      iconClass: 'bg-brand-100 text-brand-700',
      label: 'កម្ជីសកម្ម',
      value: hasActiveLoans ? formatMoney(activeLoanPrincipal, loanCurrency) : formatMoney(0, 'USD'),
      meta: hasActiveLoans
        ? activeLoanCount > 1
          ? `${activeLoanCount} កម្ជី · ${paidPercent}% បានសង`
          : `${paidPercent}% បានសង`
        : null,
      metaClass: 'text-green-600 font-medium',
    },
    {
      icon: AlertTriangle,
      iconClass: 'bg-orange-100 text-orange-700',
      label: 'នៅសល់សរុប',
      value: formatMoney(remaining, loanCurrency),
      href: hasActiveLoans ? '/dashboard/loans/repay' : null,
      linkLabel: hasActiveLoans ? 'សងកម្ជី' : null,
    },
    {
      icon: FileText,
      iconClass: 'bg-green-100 text-green-700',
      label: 'កម្ជីបានទទួល',
      value: String(loans.filter((l) => l.status === 'completed').length),
    },
  ]

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <PageHeader title="កម្ជីរបស់ខ្ញុំ" subtitle="គ្រប់គ្រងពាក្យសុំកម្ជី និង ការសងវិញរបស់អ្នក">
        {hasActiveLoans && (
          <Button href="/dashboard/loans/repay" variant="outline" size="sm">
            សងកម្ជី <ArrowRight className="w-4 h-4" />
          </Button>
        )}
        {loanEligibility.canRequestLoan ? (
          <Button href="/dashboard/loans/request" size="sm">
            <Plus className="w-4 h-4" />
            ស្នើសុំកម្ជី
          </Button>
        ) : (
          <Button
            href={totalSavings <= 0 ? '/dashboard/savings/add' : '/dashboard/savings'}
            variant="outline"
            size="sm"
          >
            <Plus className="w-4 h-4" />
            {totalSavings <= 0 ? 'ដាក់ស្នើការសន្សំ' : 'មើលសមតុល្យសន្សំ'}
          </Button>
        )}
      </PageHeader>

      {!loanEligibility.canRequestLoan && (
        <AlertBanner variant="warning" className="mb-8">
          <p className="text-amber-800">
            {totalSavings <= 0
              ? 'អ្នកត្រូវមានការសន្សំដែលបានផ្ទៀងផ្ទាត់មុនពេលអាចស្នើសុំកម្ជីបាន។'
              : 'អ្នកបានឈានដល់ដែនកំណត់កម្ជីអតិបរមា (៥ ដងនៃសមតុល្យសន្សំ) រួចហើយ។'}
          </p>
        </AlertBanner>
      )}

      <StatsTable rows={statsRows} className="mb-8" />

      {/* Loans History */}
      <div className={tableContainer}>
        <div className={dataTable.sectionHeader}>
          <h2 className={dataTable.sectionTitle}>ប្រវត្តិកម្ជី</h2>
        </div>
        <div className={tableScroll}>
          <table className={dataTable.table}>
            <thead className={dataTable.thead}>
              <tr className={dataTable.thRow}>
                <th className={dataTable.th}>គោលបំណង</th>
                <th className={dataTable.th}>ចំនួនទឹកប្រាក់</th>
                <th className={dataTable.th}>រយៈពេល</th>
                <th className={dataTable.th}>បានបើក</th>
                <th className={dataTable.th}>ស្ថានភាព</th>
                <th className={dataTable.th}>សកម្មភាព</th>
              </tr>
            </thead>
            <tbody className={dataTable.tbody}>
              {loans.length === 0 && (
                <tr>
                  <td colSpan={6} className={dataTable.emptyCell}>
                    មិនទាន់មានកម្ជីដែលបានដាក់ស្នើនៅឡើយ។
                  </td>
                </tr>
              )}
              {loans.map((loan) => (
                <tr key={loan.id} className={dataTable.tr}>
                  <td className={`${dataTable.td} font-medium`}>{loan.purpose}</td>
                  <td className={`${dataTable.td} font-semibold tabular-nums`}>{formatMoney(toNumber(loan.amount), normalizeCurrency(loan.currency))}</td>
                  <td className={dataTable.tdMuted}>{loan.term_months} ខែ</td>
                  <td className={dataTable.tdMuted}>
                    {loan.disbursed_at ? formatKhmerDate(loan.disbursed_at) : 'រង់ចាំ'}
                  </td>
                  <td className={dataTable.td}>
                    <LoanStatusBadge status={loan.status} plain />
                  </td>
                  <td className={dataTable.td}>
                    {loan.status === 'active' && (
                      <Link
                        href="/dashboard/loans/repay"
                        className="text-brand-700 hover:text-brand-900 text-sm font-medium transition-colors"
                      >
                        សងវិញ
                      </Link>
                    )}
                    {loan.status === 'completed' && (
                      <span className="text-foreground text-sm">បានទទួល</span>
                    )}
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
