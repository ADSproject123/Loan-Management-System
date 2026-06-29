import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { LoanStatusBadge } from '@/components/ui/Badge'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatsTable, type StatsRow } from '@/components/ui/StatsTable'
import { AlertBanner } from '@/components/ui/AlertBanner'
import { Button } from '@/components/ui/Button'
import { requireMember } from '@/lib/auth/member'
import { createAdminClient } from '@/lib/supabase/admin'
import { formatMoney, normalizeCurrency } from '@/lib/currency'
import { formatKhmerDate } from '@/lib/dates'
import { getInterestSettings, loanRepaymentSummary, resolveLoanInterestRate } from '@/lib/interest'
import { getLoanEligibility, sumCommittedLoanPrincipal, sumVerifiedSavings } from '@/lib/loanEligibility'
import { toNumber } from '@/lib/utils'
import { CreditCard, Plus, FileText, AlertTriangle, ArrowRight } from 'lucide-react'

export default async function LoansPage() {
  const member = await requireMember()
  const admin = createAdminClient()
  const [loansResult, repaymentsResult, savingsResult] = await Promise.all([
    admin
      .from('loans')
      .select('id, amount, currency, purpose, term_months, monthly_interest_rate, status, disbursed_at, due_date, created_at')
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
  const paidByLoan = new Map<string, number>()

  repayments
    .filter((repayment) => repayment.status === 'verified' || repayment.status === 'completed')
    .forEach((repayment) => {
      paidByLoan.set(
        repayment.loan_id,
        (paidByLoan.get(repayment.loan_id) ?? 0) + toNumber(repayment.amount)
      )
    })

  const activeLoan = loans.find((loan) => loan.status === 'active')
  const activeLoanPaid = activeLoan ? paidByLoan.get(activeLoan.id) ?? 0 : 0
  const activeLoanPrincipal = activeLoan ? toNumber(activeLoan.amount) : 0
  const activeLoanTerm = activeLoan ? toNumber(activeLoan.term_months) || 12 : 12
  const activeLoanRate = activeLoan
    ? resolveLoanInterestRate(activeLoan, interestSettings.monthlyLoanInterestRate)
    : interestSettings.monthlyLoanInterestRate
  const activeLoanTotalOwed = activeLoan
    ? loanRepaymentSummary(activeLoanPrincipal, activeLoanTerm, activeLoanRate).totalRepayment
    : 0
  const remaining = activeLoan ? Math.max(activeLoanTotalOwed - activeLoanPaid, 0) : 0
  const totalSavings = sumVerifiedSavings(savingsResult.data ?? [])
  const loanEligibility = getLoanEligibility(totalSavings, sumCommittedLoanPrincipal(loans))
  const loanCurrency = activeLoan ? normalizeCurrency(activeLoan.currency) : 'USD'
  const paidPercent = activeLoanTotalOwed > 0 ? Math.round((activeLoanPaid / activeLoanTotalOwed) * 100) : 0

  const statsRows: StatsRow[] = [
    {
      icon: CreditCard,
      iconClass: 'bg-brand-100 text-brand-700',
      label: 'កម្ជីសកម្ម',
      value: activeLoan ? formatMoney(activeLoanPrincipal, loanCurrency) : formatMoney(0, 'USD'),
      meta: activeLoan ? `${paidPercent}% បានសង` : null,
      metaClass: 'text-green-600 font-medium',
    },
    {
      icon: AlertTriangle,
      iconClass: 'bg-orange-100 text-orange-700',
      label: 'នៅសល់សរុប',
      value: formatMoney(remaining, loanCurrency),
      href: activeLoan ? '/dashboard/loans/repay' : null,
      linkLabel: activeLoan ? 'សងកម្ជី' : null,
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
        {activeLoan && (
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
      <Card padding="none">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">ប្រវត្តិកម្ជី</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">គោលបំណង</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">ចំនួនទឹកប្រាក់</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">រយៈពេល</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">បានបើក</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">ស្ថានភាព</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">សកម្មភាព</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loans.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-500">
                    មិនទាន់មានកម្ជីដែលបានដាក់ស្នើនៅឡើយ។
                  </td>
                </tr>
              )}
              {loans.map((loan) => (
                <tr key={loan.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm text-gray-900 font-medium">{loan.purpose}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900">{formatMoney(toNumber(loan.amount), normalizeCurrency(loan.currency))}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{loan.term_months} ខែ</td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {loan.disbursed_at ? formatKhmerDate(loan.disbursed_at) : 'រង់ចាំ'}
                  </td>
                  <td className="px-6 py-4">
                    <LoanStatusBadge status={loan.status} plain />
                  </td>
                  <td className="px-6 py-4">
                    {loan.status === 'active' && (
                      <Link
                        href="/dashboard/loans/repay"
                        className="text-brand-700 hover:text-brand-900 text-sm font-medium transition-colors"
                      >
                        សងវិញ
                      </Link>
                    )}
                    {loan.status === 'completed' && (
                      <span className="text-gray-400 text-sm">បានទទួល</span>
                    )}
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
