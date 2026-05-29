import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { SavingStatusBadge } from '@/components/ui/Badge'
import { requireMember } from '@/lib/auth/member'
import { createAdminClient } from '@/lib/supabase/admin'
import { PiggyBank, Plus, FileText, TrendingUp, ChevronRight } from 'lucide-react'

function toNumber(value: unknown) {
  const numberValue = Number(value ?? 0)
  return Number.isFinite(numberValue) ? numberValue : 0
}

export default async function SavingsPage() {
  const member = await requireMember()
  const admin = createAdminClient()
  const { data } = await admin
    .from('savings')
    .select('id, amount, saving_date, status, notes')
    .eq('member_id', member.id)
    .order('saving_date', { ascending: false })

  const savings = data ?? []
  const verifiedSavings = savings.filter((saving) => saving.status === 'verified' || saving.status === 'completed')
  const totalSavings = verifiedSavings.reduce((sum, saving) => sum + toNumber(saving.amount), 0)
  const monthlyInterest = totalSavings * 0.03

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">ការសន្សំរបស់ខ្ញុំ</h1>
          <p className="text-gray-500 text-sm mt-1">តាមដានការបរិច្ចាគប្រចាំខែ និង ការប្រាក់របស់អ្នក</p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/dashboard/savings/report"
            className="inline-flex items-center gap-2 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            <FileText className="w-4 h-4" />
            ស្នើសុំរបាយការណ៍
          </Link>
          <Link
            href="/dashboard/savings/add"
            className="inline-flex items-center gap-2 bg-blue-900 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-800 transition-colors"
          >
            <Plus className="w-4 h-4" />
            បន្ថែមការសន្សំ
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
          <p className="text-gray-500 text-sm mt-1">សមតុល្យសន្សំសរុប</p>
        </Card>
        <Card>
          <div className="p-2.5 bg-blue-100 rounded-lg inline-flex mb-3">
            <TrendingUp className="w-5 h-5 text-blue-700" />
          </div>
          <p className="text-2xl font-bold text-gray-900">฿{monthlyInterest.toLocaleString()}</p>
          <p className="text-gray-500 text-sm mt-1">ការប្រាក់ប្រចាំខែ (៣%)</p>
        </Card>
        <Card>
          <div className="p-2.5 bg-purple-100 rounded-lg inline-flex mb-3">
            <ChevronRight className="w-5 h-5 text-purple-700" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{savings.length}</p>
          <p className="text-gray-500 text-sm mt-1">ការបរិច្ចាគសរុប</p>
        </Card>
      </div>

      {/* Savings Table */}
      <Card padding="none">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">ប្រវត្តិការសន្សំ</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">កាលបរិច្ឆេទ</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">ចំនួនទឹកប្រាក់</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">កំណត់ចំណាំ</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">ស្ថានភាព</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {savings.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-sm text-gray-500">
                    មិនទាន់មានការសន្សំដែលបានដាក់ស្នើនៅឡើយ។
                  </td>
                </tr>
              )}
              {savings.map((saving) => (
                <tr key={saving.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {new Date(saving.saving_date).toLocaleDateString('km-KH', { day: 'numeric', month: 'long', year: 'numeric' })}
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
            <p className="text-blue-900 font-semibold text-sm">របៀបដែលការសន្សំរបស់អ្នករីកចម្រើន</p>
            <p className="text-blue-700 text-sm mt-1">
              ការសន្សំរបស់អ្នកទទួលបានការប្រាក់ ៣% ក្នុងមួយខែលើសមតុល្យសរុប។ ការប្រាក់ត្រូវបានឥណពន្ធដោយស្វ័យប្រវត្តិ
              នៅចុងខែនីមួយៗ។ អ្នកអាចស្នើសុំរបាយការណ៍សន្សំភ្លាមៗដើម្បីមើលការគណនាលម្អិត។
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
