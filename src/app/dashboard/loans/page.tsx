import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { LoanStatusBadge } from '@/components/ui/Badge'
import { CreditCard, Plus, FileText, ArrowRight, AlertTriangle } from 'lucide-react'

// Mock loan data
const mockLoans = [
  {
    id: '1',
    amount: 50000,
    purpose: 'Business expansion',
    term_months: 12,
    interest_rate: 2,
    status: 'active' as const,
    disbursed_at: '2025-02-01',
    due_date: '2026-01-01',
    paid: 20000,
  },
  {
    id: '2',
    amount: 20000,
    purpose: 'Medical expenses',
    term_months: 6,
    interest_rate: 1.5,
    status: 'completed' as const,
    disbursed_at: '2024-06-01',
    due_date: '2024-11-30',
    paid: 20000,
  },
]

const activeLoan = mockLoans.find((l) => l.status === 'active')
const remaining = activeLoan ? activeLoan.amount - activeLoan.paid : 0

export default function LoansPage() {
  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">My Loans</h1>
          <p className="text-gray-500 text-sm mt-1">Manage your loan applications and repayments</p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/dashboard/loans/report"
            className="inline-flex items-center gap-2 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            <FileText className="w-4 h-4" />
            Report
          </Link>
          <Link
            href="/dashboard/loans/request"
            className="inline-flex items-center gap-2 bg-blue-900 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-800 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Request Loan
          </Link>
        </div>
      </div>

      {/* Active Loan Summary */}
      {activeLoan && (
        <div className="bg-gradient-to-r from-blue-900 to-blue-700 text-white rounded-xl p-6 mb-8">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-blue-200 text-sm mb-1">Active Loan</p>
              <p className="text-3xl font-bold">฿{activeLoan.amount.toLocaleString()}</p>
              <p className="text-blue-200 text-sm mt-1">{activeLoan.purpose}</p>
            </div>
            <div className="text-right">
              <p className="text-blue-200 text-sm mb-1">Remaining</p>
              <p className="text-2xl font-bold">฿{remaining.toLocaleString()}</p>
            </div>
          </div>
          <div className="bg-white/20 rounded-full h-2 mb-4">
            <div
              className="bg-white rounded-full h-2 transition-all"
              style={{ width: `${(activeLoan.paid / activeLoan.amount) * 100}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-blue-200">Paid: ฿{activeLoan.paid.toLocaleString()} ({Math.round((activeLoan.paid / activeLoan.amount) * 100)}%)</span>
            <span className="text-blue-200">Due: {new Date(activeLoan.due_date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
          </div>
          <div className="mt-4 pt-4 border-t border-white/20 flex gap-3">
            <Link
              href="/dashboard/loans/repay"
              className="inline-flex items-center gap-2 bg-white text-blue-900 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-50 transition-colors"
            >
              Make Repayment <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/dashboard/loans/report"
              className="inline-flex items-center gap-2 border border-white/40 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-white/10 transition-colors"
            >
              View Report
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
          <p className="text-2xl font-bold text-gray-900">{mockLoans.filter(l => l.status === 'active').length}</p>
          <p className="text-gray-500 text-sm mt-1">Active Loans</p>
        </Card>
        <Card>
          <div className="p-2.5 bg-green-100 rounded-lg inline-flex mb-3">
            <FileText className="w-5 h-5 text-green-700" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{mockLoans.filter(l => l.status === 'completed').length}</p>
          <p className="text-gray-500 text-sm mt-1">Completed Loans</p>
        </Card>
        <Card>
          <div className="p-2.5 bg-orange-100 rounded-lg inline-flex mb-3">
            <AlertTriangle className="w-5 h-5 text-orange-700" />
          </div>
          <p className="text-2xl font-bold text-gray-900">฿{remaining.toLocaleString()}</p>
          <p className="text-gray-500 text-sm mt-1">Total Remaining</p>
        </Card>
      </div>

      {/* Loans List */}
      <Card padding="none">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Loan History</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Purpose</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Rate</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Term</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Disbursed</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {mockLoans.map((loan) => (
                <tr key={loan.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm text-gray-900 font-medium">{loan.purpose}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900">฿{loan.amount.toLocaleString()}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{loan.interest_rate}%/mo</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{loan.term_months} months</td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(loan.disbursed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
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
                        Repay
                      </Link>
                    )}
                    {loan.status === 'completed' && (
                      <span className="text-gray-400 text-sm">Completed</span>
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
          <h3 className="font-semibold text-blue-900 mb-2">No Active Loans</h3>
          <p className="text-blue-700 text-sm mb-4">Need financial support? Apply for a member loan today.</p>
          <Link
            href="/dashboard/loans/request"
            className="inline-flex items-center gap-2 bg-blue-900 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-800 transition-colors"
          >
            Request a Loan <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}
    </div>
  )
}
