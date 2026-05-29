import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { LoanStatusBadge } from '@/components/ui/Badge'
import { requireMember } from '@/lib/auth/member'
import { createAdminClient } from '@/lib/supabase/admin'
import { CreditCard, Plus, FileText, ArrowRight, AlertTriangle } from 'lucide-react'

function toNumber(value: unknown) {
  const numberValue = Number(value ?? 0)
  return Number.isFinite(numberValue) ? numberValue : 0
}

export default async function LoansPage() {
  const member = await requireMember()
  const admin = createAdminClient()
  const [loansResult, repaymentsResult] = await Promise.all([
    admin
      .from('loans')
      .select('id, amount, purpose, term_months, interest_rate, status, disbursed_at, due_date, created_at')
      .eq('member_id', member.id)
      .order('created_at', { ascending: false }),
    admin
      .from('loan_repayments')
      .select('loan_id, amount, status')
      .eq('member_id', member.id),
  ])

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
  const remaining = activeLoan ? Math.max(toNumber(activeLoan.amount) - activeLoanPaid, 0) : 0

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">ឥណទានរបស់ខ្ញុំ</h1>
          <p className="text-gray-500 text-sm mt-1">គ្រប់គ្រងពាក្យសុំឥណទាន និង ការសងវិញរបស់អ្នក</p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/dashboard/loans/report"
            className="inline-flex items-center gap-2 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            <FileText className="w-4 h-4" />
            របាយការណ៍
          </Link>
          <Link
            href="/dashboard/loans/request"
            className="inline-flex items-center gap-2 bg-blue-900 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-800 transition-colors"
          >
            <Plus className="w-4 h-4" />
            ស្នើសុំឥណទាន
          </Link>
        </div>
      </div>

      {/* Active Loan Summary */}
      {activeLoan && (
        <div className="bg-gradient-to-r from-blue-900 to-blue-700 text-white rounded-xl p-6 mb-8">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-blue-200 text-sm mb-1">ឥណទានសកម្ម</p>
              <p className="text-3xl font-bold">฿{toNumber(activeLoan.amount).toLocaleString()}</p>
              <p className="text-blue-200 text-sm mt-1">{activeLoan.purpose}</p>
            </div>
            <div className="text-right">
              <p className="text-blue-200 text-sm mb-1">នៅសល់</p>
              <p className="text-2xl font-bold">฿{remaining.toLocaleString()}</p>
            </div>
          </div>
          <div className="bg-white/20 rounded-full h-2 mb-4">
            <div
              className="bg-white rounded-full h-2 transition-all"
              style={{ width: `${(activeLoanPaid / toNumber(activeLoan.amount)) * 100}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-blue-200">បានបង់៖ ฿{activeLoanPaid.toLocaleString()} ({Math.round((activeLoanPaid / toNumber(activeLoan.amount)) * 100)}%)</span>
            <span className="text-blue-200">ត្រូវសង៖ {activeLoan.due_date ? new Date(activeLoan.due_date).toLocaleDateString('km-KH', { month: 'long', year: 'numeric' }) : 'មិនទាន់កំណត់'}</span>
          </div>
          <div className="mt-4 pt-4 border-t border-white/20 flex gap-3">
            <Link
              href="/dashboard/loans/repay"
              className="inline-flex items-center gap-2 bg-white text-blue-900 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-50 transition-colors"
            >
              សងឥណទាន <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/dashboard/loans/report"
              className="inline-flex items-center gap-2 border border-white/40 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-white/10 transition-colors"
            >
              មើលរបាយការណ៍
            </Link>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <Card>
          <div className="p-2.5 bg-blue-100 rounded-lg inline-flex mb-3">
            <CreditCard className="w-5 h-5 text-blue-700" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{loans.filter(l => l.status === 'active').length}</p>
          <p className="text-gray-500 text-sm mt-1">ឥណទានសកម្ម</p>
        </Card>
        <Card>
          <div className="p-2.5 bg-green-100 rounded-lg inline-flex mb-3">
            <FileText className="w-5 h-5 text-green-700" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{loans.filter(l => l.status === 'completed').length}</p>
          <p className="text-gray-500 text-sm mt-1">ឥណទានបានបញ្ចប់</p>
        </Card>
        <Card>
          <div className="p-2.5 bg-orange-100 rounded-lg inline-flex mb-3">
            <AlertTriangle className="w-5 h-5 text-orange-700" />
          </div>
          <p className="text-2xl font-bold text-gray-900">฿{remaining.toLocaleString()}</p>
          <p className="text-gray-500 text-sm mt-1">នៅសល់សរុប</p>
        </Card>
      </div>

      {/* Loans List */}
      <Card padding="none">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">ប្រវត្តិឥណទាន</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">គោលបំណង</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">ចំនួនទឹកប្រាក់</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">អត្រា</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">រយៈពេល</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">បានបើក</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">ស្ថានភាព</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">សកម្មភាព</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loans.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-sm text-gray-500">
                    មិនទាន់មានឥណទានដែលបានដាក់ស្នើនៅឡើយ។
                  </td>
                </tr>
              )}
              {loans.map((loan) => (
                <tr key={loan.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm text-gray-900 font-medium">{loan.purpose}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900">฿{toNumber(loan.amount).toLocaleString()}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{loan.interest_rate}%/ខែ</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{loan.term_months} ខែ</td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {loan.disbursed_at ? new Date(loan.disbursed_at).toLocaleDateString('km-KH', { month: 'short', day: 'numeric', year: 'numeric' }) : 'រង់ចាំ'}
                  </td>
                  <td className="px-6 py-4">
                    <LoanStatusBadge status={loan.status} />
                  </td>
                  <td className="px-6 py-4">
                    {loan.status === 'active' && (
                      <Link
                        href="/dashboard/loans/repay"
                        className="text-blue-700 hover:text-blue-900 text-sm font-medium transition-colors"
                      >
                        សងវិញ
                      </Link>
                    )}
                    {loan.status === 'completed' && (
                      <span className="text-gray-400 text-sm">បានបញ្ចប់</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* No active loan - request prompt */}
      {!activeLoan && (
        <div className="mt-6 bg-blue-50 border border-blue-100 rounded-xl p-6 text-center">
          <CreditCard className="w-10 h-10 text-blue-300 mx-auto mb-3" />
          <h3 className="font-semibold text-blue-900 mb-2">មិនមានឥណទានសកម្ម</h3>
          <p className="text-blue-700 text-sm mb-4">ត្រូវការការគាំទ្រហិរញ្ញវត្ថុ? ដាក់ពាក្យសុំឥណទានសមាជិកថ្ងៃនេះ។</p>
          <Link
            href="/dashboard/loans/request"
            className="inline-flex items-center gap-2 bg-blue-900 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-800 transition-colors"
          >
            ស្នើសុំឥណទាន <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}
    </div>
  )
}
