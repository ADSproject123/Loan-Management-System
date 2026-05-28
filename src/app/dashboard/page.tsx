import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { MemberStatusBadge } from '@/components/ui/Badge'
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

// Mock data for UI demonstration
const mockMember = {
  full_name: 'Somchai Jaidee',
  email: 'somchai@example.com',
  status: 'active' as const,
  joined_at: '2024-01-15',
}

const mockStats = {
  totalSavings: 45000,
  monthlyInterest: 1350,
  activeLoanAmount: 20000,
  availableCredit: 25000,
}

const mockActivity = [
  { id: 1, type: 'saving', description: 'Monthly saving added', amount: 3000, date: '2025-05-01', status: 'completed' },
  { id: 2, type: 'loan_repay', description: 'Loan repayment', amount: 5000, date: '2025-04-28', status: 'completed' },
  { id: 3, type: 'interest', description: 'Interest credited', amount: 1350, date: '2025-04-30', status: 'completed' },
]

const mockNotifications = [
  { id: 1, title: 'Saving Verified', message: 'Your April saving of ฿3,000 has been verified.', time: '2 hours ago', read: false },
  { id: 2, title: 'Account Approved', message: 'Welcome! Your SanSam account is now active.', time: '3 days ago', read: true },
]

export default function DashboardPage() {
  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Welcome back, {mockMember.full_name.split(' ')[0]}!
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <p className="text-gray-500 text-sm">Member since {new Date(mockMember.joined_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
            <span className="text-gray-300">•</span>
            <MemberStatusBadge status={mockMember.status} />
          </div>
        </div>
        <div className="relative">
          <button className="relative p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 transition-colors">
            <Bell className="w-5 h-5 text-gray-600" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
        </div>
      </div>

      {/* Quick Action Banner */}
      <div className="bg-gradient-to-r from-blue-900 to-blue-700 text-white rounded-xl p-5 mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Calendar className="w-6 h-6 text-blue-200 flex-shrink-0" />
          <div>
            <p className="font-semibold">May Saving Due</p>
            <p className="text-blue-200 text-sm">Add your monthly saving before end of month</p>
          </div>
        </div>
        <Link
          href="/dashboard/savings/add"
          className="flex items-center gap-1 bg-white text-blue-900 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-50 transition-colors flex-shrink-0"
        >
          Add Now <ArrowRight className="w-4 h-4" />
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
          <p className="text-2xl font-bold text-gray-900">฿{mockStats.totalSavings.toLocaleString()}</p>
          <p className="text-gray-500 text-sm mt-1">Total Savings</p>
          <p className="text-green-600 text-xs mt-2 font-medium">+฿{mockStats.monthlyInterest.toLocaleString()} this month</p>
        </Card>

        <Card>
          <div className="p-2.5 bg-blue-100 rounded-lg inline-flex mb-3">
            <TrendingUp className="w-5 h-5 text-blue-700" />
          </div>
          <p className="text-2xl font-bold text-gray-900">฿{mockStats.monthlyInterest.toLocaleString()}</p>
          <p className="text-gray-500 text-sm mt-1">Monthly Interest</p>
          <p className="text-blue-600 text-xs mt-2 font-medium">3% per month</p>
        </Card>

        <Card>
          <div className="p-2.5 bg-orange-100 rounded-lg inline-flex mb-3">
            <CreditCard className="w-5 h-5 text-orange-700" />
          </div>
          <p className="text-2xl font-bold text-gray-900">฿{mockStats.activeLoanAmount.toLocaleString()}</p>
          <p className="text-gray-500 text-sm mt-1">Active Loan</p>
          <Link href="/dashboard/loans" className="text-orange-600 text-xs mt-2 font-medium hover:text-orange-700 inline-flex items-center gap-1">
            View details <ChevronRight className="w-3 h-3" />
          </Link>
        </Card>

        <Card>
          <div className="p-2.5 bg-purple-100 rounded-lg inline-flex mb-3">
            <Wallet className="w-5 h-5 text-purple-700" />
          </div>
          <p className="text-2xl font-bold text-gray-900">฿{mockStats.availableCredit.toLocaleString()}</p>
          <p className="text-gray-500 text-sm mt-1">Available Credit</p>
          <Link href="/dashboard/loans/request" className="text-purple-600 text-xs mt-2 font-medium hover:text-purple-700 inline-flex items-center gap-1">
            Request loan <ChevronRight className="w-3 h-3" />
          </Link>
        </Card>
      </div>

      {/* Two Column Layout */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="lg:col-span-1">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            {[
              {
                href: '/dashboard/savings/add',
                icon: PiggyBank,
                label: 'Add Monthly Saving',
                description: 'Record your monthly contribution',
                color: 'bg-green-50 text-green-700',
              },
              {
                href: '/dashboard/loans/request',
                icon: CreditCard,
                label: 'Request a Loan',
                description: 'Apply for a member loan',
                color: 'bg-blue-50 text-blue-700',
              },
              {
                href: '/dashboard/loans/repay',
                icon: ArrowRight,
                label: 'Make Repayment',
                description: 'Pay loan installment',
                color: 'bg-orange-50 text-orange-700',
              },
              {
                href: '/dashboard/capital',
                icon: Wallet,
                label: 'Capital Request',
                description: 'Request savings withdrawal',
                color: 'bg-purple-50 text-purple-700',
              },
            ].map((action) => {
              const Icon = action.icon
              return (
                <Link
                  key={action.href}
                  href={action.href}
                  className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all group"
                >
                  <div className={`p-2.5 rounded-lg flex-shrink-0 ${action.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 text-sm">{action.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{action.description}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
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
              <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
              <Link href="/dashboard/savings" className="text-blue-700 text-sm hover:text-blue-900 transition-colors">
                View all
              </Link>
            </div>
            <Card padding="none">
              <div className="divide-y divide-gray-100">
                {mockActivity.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 p-4">
                    <div className={`p-2 rounded-lg flex-shrink-0 ${
                      item.type === 'saving' ? 'bg-green-100' :
                      item.type === 'loan_repay' ? 'bg-orange-100' :
                      'bg-blue-100'
                    }`}>
                      {item.type === 'saving' ? (
                        <PiggyBank className="w-4 h-4 text-green-700" />
                      ) : item.type === 'loan_repay' ? (
                        <CreditCard className="w-4 h-4 text-orange-700" />
                      ) : (
                        <TrendingUp className="w-4 h-4 text-blue-700" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{item.description}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{new Date(item.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-semibold ${item.type === 'loan_repay' ? 'text-orange-600' : 'text-green-600'}`}>
                        {item.type === 'loan_repay' ? '-' : '+'}฿{item.amount.toLocaleString()}
                      </p>
                      <div className="flex items-center gap-1 justify-end mt-0.5">
                        <CheckCircle className="w-3 h-3 text-green-500" />
                        <span className="text-xs text-gray-400">Verified</span>
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
              <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
              <button className="text-blue-700 text-sm hover:text-blue-900 transition-colors">
                Mark all read
              </button>
            </div>
            <div className="space-y-3">
              {mockNotifications.map((notif) => (
                <div key={notif.id} className={`p-4 rounded-xl border ${notif.read ? 'bg-white border-gray-200' : 'bg-blue-50 border-blue-200'}`}>
                  <div className="flex items-start gap-3">
                    <div className={`p-1.5 rounded-full flex-shrink-0 ${notif.read ? 'bg-gray-100' : 'bg-blue-100'}`}>
                      {notif.read ? (
                        <CheckCircle className="w-4 h-4 text-gray-400" />
                      ) : (
                        <Bell className="w-4 h-4 text-blue-700" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className={`text-sm font-medium ${notif.read ? 'text-gray-700' : 'text-blue-900'}`}>{notif.title}</p>
                        <div className="flex items-center gap-1 text-gray-400 flex-shrink-0">
                          <Clock className="w-3 h-3" />
                          <span className="text-xs">{notif.time}</span>
                        </div>
                      </div>
                      <p className={`text-sm mt-1 ${notif.read ? 'text-gray-500' : 'text-blue-700'}`}>{notif.message}</p>
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
          <p className="text-yellow-900 font-semibold text-sm">Capital Withdrawal Window</p>
          <p className="text-yellow-700 text-sm mt-1">
            Capital withdrawal requests are accepted only during January 20-25 each year.
            If you plan to withdraw your savings capital, please submit your request during this period.
          </p>
          <Link href="/dashboard/capital" className="inline-flex items-center gap-1 text-yellow-800 text-sm font-medium mt-2 hover:text-yellow-900 transition-colors">
            Learn about capital requests <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  )
}
