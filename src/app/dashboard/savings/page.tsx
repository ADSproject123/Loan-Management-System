import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { SavingStatusBadge } from '@/components/ui/Badge'
import { PiggyBank, Plus, FileText, TrendingUp, ChevronRight } from 'lucide-react'

// Mock savings data
const mockSavings = [
  { id: '1', amount: 3000, saving_date: '2025-05-01', status: 'completed' as const, notes: 'May saving' },
  { id: '2', amount: 3000, saving_date: '2025-04-01', status: 'completed' as const, notes: 'April saving' },
  { id: '3', amount: 2500, saving_date: '2025-03-01', status: 'completed' as const, notes: 'March saving' },
  { id: '4', amount: 3000, saving_date: '2025-02-01', status: 'completed' as const, notes: 'February saving' },
  { id: '5', amount: 3000, saving_date: '2025-01-01', status: 'completed' as const, notes: 'January saving' },
  { id: '6', amount: 3000, saving_date: '2024-12-01', status: 'completed' as const, notes: 'December saving' },
]

const totalSavings = mockSavings.reduce((sum, s) => sum + s.amount, 0)
const monthlyInterest = totalSavings * 0.03

export default function SavingsPage() {
  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">My Savings</h1>
          <p className="text-gray-500 text-sm mt-1">Track your monthly contributions and earnings</p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/dashboard/savings/report"
            className="inline-flex items-center gap-2 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            <FileText className="w-4 h-4" />
            Request Report
          </Link>
          <Link
            href="/dashboard/savings/add"
            className="inline-flex items-center gap-2 bg-blue-900 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-800 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Saving
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-3 gap-4 md:gap-6 mb-8">
        <Card>
          <div className="p-2.5 bg-green-100 rounded-lg inline-flex mb-3">
            <PiggyBank className="w-5 h-5 text-green-700" />
          </div>
          <p className="text-2xl font-bold text-gray-900">฿{totalSavings.toLocaleString()}</p>
          <p className="text-gray-500 text-sm mt-1">Total Savings Balance</p>
        </Card>
        <Card>
          <div className="p-2.5 bg-blue-100 rounded-lg inline-flex mb-3">
            <TrendingUp className="w-5 h-5 text-blue-700" />
          </div>
          <p className="text-2xl font-bold text-gray-900">฿{monthlyInterest.toLocaleString()}</p>
          <p className="text-gray-500 text-sm mt-1">Monthly Interest (3%)</p>
        </Card>
        <Card>
          <div className="p-2.5 bg-purple-100 rounded-lg inline-flex mb-3">
            <ChevronRight className="w-5 h-5 text-purple-700" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{mockSavings.length}</p>
          <p className="text-gray-500 text-sm mt-1">Total Contributions</p>
        </Card>
      </div>

      {/* Savings Table */}
      <Card padding="none">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Saving History</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Notes</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {mockSavings.map((saving) => (
                <tr key={saving.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {new Date(saving.saving_date).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-semibold text-green-700">+฿{saving.amount.toLocaleString()}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{saving.notes || '—'}</td>
                  <td className="px-6 py-4">
                    <SavingStatusBadge status={saving.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Info Card */}
      <div className="mt-6 bg-blue-50 rounded-xl p-5 border border-blue-100">
        <div className="flex items-start gap-3">
          <TrendingUp className="w-5 h-5 text-blue-700 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-blue-900 font-semibold text-sm">How Your Savings Grow</p>
            <p className="text-blue-700 text-sm mt-1">
              Your savings earn 3% interest per month on the total balance. Interest is credited automatically
              at the end of each month. You can request an instant savings report to see detailed calculations.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
