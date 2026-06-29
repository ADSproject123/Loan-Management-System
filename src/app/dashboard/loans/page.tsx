import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { LoanStatusBadge } from '@/components/ui/Badge'
import { requireMember } from '@/lib/auth/member'
import { createAdminClient } from '@/lib/supabase/admin'
import { formatMoney, normalizeCurrency } from '@/lib/currency'
import { getInterestSettings, loanRepaymentSummary, resolveLoanInterestRate } from '@/lib/interest'
import { getLoanEligibility, sumCommittedLoanPrincipal, sumVerifiedSavings } from '@/lib/loanEligibility'
import { CreditCard, Plus, ArrowRight, AlertTriangle, FileText } from 'lucide-react'
import { toNumber } from '@/lib/utils'

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

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">កម្ជីរបស់ខ្ញុំ</h1>
          <p className="text-gray-500 text-sm mt-1">គ្រប់គ្រងពាក្យសុំកម្ជី និង ការសងវិញរបស់អ្នក</p>
        </div>
        <div className="flex gap-3">
          {loanEligibility.canRequestLoan ? (
            <Link
              href="/dashboard/loans/request"
              className="inline-flex items-center gap-2 bg-brand-950 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-brand-800 transition-colors"
            >
              <Plus className="w-4 h-4" />
              ស្នើសុំកម្ជី
            </Link>
          ) : (
            <Link
              href={totalSavings <= 0 ? '/dashboard/savings/add' : '/dashboard/savings'}
              className="inline-flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              <Plus className="w-4 h-4" />
              {totalSavings <= 0 ? 'ដាក់ស្នើការសន្សំ' : 'មើលសមតុល្យសន្សំ'}
            </Link>
          )}
        </div>
      </div>

      {!loanEligibility.canRequestLoan && (
        <div className="mb-8 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <p className="text-sm text-amber-800">
            {totalSavings <= 0
              ? 'អ្នកត្រូវមានការសន្សំដែលបានផ្ទៀងផ្ទាត់មុនពេលអាចស្នើសុំកម្ជីបាន។'
              : 'អ្នកបានឈានដល់ដែនកំណត់កម្ជីអតិបរមា (៥ ដងនៃសមតុល្យសន្សំ) រួចហើយ។'}
          </p>
        </div>
      )}

      {/* Active Loan Summary */}
      {activeLoan && (
        <div className="bg-brand-950 text-white rounded-xl p-6 mb-8">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-brand-200 text-sm mb-1">កម្ជីសកម្ម</p>
              <p className="text-3xl font-bold">{formatMoney(toNumber(activeLoan.amount), normalizeCurrency(activeLoan.currency))}</p>
              <p className="text-brand-200 text-sm mt-1">{activeLoan.purpose}</p>
            </div>
            <div className="text-right">
              <p className="text-brand-200 text-sm mb-1">នៅសល់</p>
              <p className="text-2xl font-bold">{formatMoney(remaining, normalizeCurrency(activeLoan.currency))}</p>
            </div>
          </div>
          <div className="bg-white/20 rounded-full h-2 mb-4">
            <div
              className="bg-white rounded-full h-2 transition-all"
              style={{ width: `${activeLoanTotalOwed > 0 ? (activeLoanPaid / activeLoanTotalOwed) * 100 : 0}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-brand-200">បានបង់៖ {formatMoney(activeLoanPaid, normalizeCurrency(activeLoan.currency))} ({activeLoanTotalOwed > 0 ? Math.round((activeLoanPaid / activeLoanTotalOwed) * 100) : 0}%)</span>
            <span className="text-brand-200">ត្រូវសង៖ {activeLoan.due_date ? new Date(activeLoan.due_date).toLocaleDateString('km-KH', { month: 'long', year: 'numeric' }) : 'មិនទាន់កំណត់'}</span>
          </div>
          <div className="mt-4 pt-4 border-t border-white/20 flex gap-3">
            <Link
              href="/dashboard/loans/repay"
              className="inline-flex items-center gap-2 bg-white text-brand-900 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-brand-50 transition-colors"
            >
              សងកម្ជី <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <Card>
          <div className="p-2.5 bg-brand-100 rounded-lg inline-flex mb-3">
            <CreditCard className="w-5 h-5 text-brand-700" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{loans.filter(l => l.status === 'active').length}</p>
          <p className="text-gray-500 text-sm mt-1">កម្ជីសកម្ម</p>
        </Card>
        <Card>
          <div className="p-2.5 bg-green-100 rounded-lg inline-flex mb-3">
            <FileText className="w-5 h-5 text-green-700" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{loans.filter(l => l.status === 'completed').length}</p>
          <p className="text-gray-500 text-sm mt-1">កម្ជីបានទទួល</p>
        </Card>
        <Card>
          <div className="p-2.5 bg-orange-100 rounded-lg inline-flex mb-3">
            <AlertTriangle className="w-5 h-5 text-orange-700" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{activeLoan ? formatMoney(remaining, normalizeCurrency(activeLoan.currency)) : formatMoney(remaining, 'USD')}</p>
          <p className="text-gray-500 text-sm mt-1">នៅសល់សរុប</p>
        </Card>
      </div>

      {/* Loans List */}
      <Card padding="none">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
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
                    {loan.disbursed_at ? new Date(loan.disbursed_at).toLocaleDateString('km-KH', { month: 'short', day: 'numeric', year: 'numeric' }) : 'រង់ចាំ'}
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
