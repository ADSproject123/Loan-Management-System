import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { createAdminClient } from '@/lib/supabase/admin'
import { formatDate, money, relatedMemberName } from '@/app/admin/adminUtils'
import { ArrowRight, CreditCard, FileText, PiggyBank, Users, Wallet } from 'lucide-react'

export default async function AdminPage() {
  const admin = createAdminClient()
  const [members, savings, repayments, loans, capitalRequests, reports, activeMembers] = await Promise.all([
    admin
      .from('members')
      .select('id, full_name, email, created_at')
      .eq('status', 'pending')
      .order('created_at', { ascending: true }),
    admin
      .from('savings')
      .select('id, amount, created_at, members:members!savings_member_id_fkey(full_name, email)')
      .eq('status', 'pending')
      .order('created_at', { ascending: true }),
    admin
      .from('loan_repayments')
      .select('id, amount, created_at, members:members!loan_repayments_member_id_fkey(full_name, email)')
      .eq('status', 'pending')
      .order('created_at', { ascending: true }),
    admin
      .from('loans')
      .select('id, amount, purpose, status, created_at, members:members!loans_member_id_fkey(full_name, email)')
      .in('status', ['under_review', 'approved'])
      .order('created_at', { ascending: true }),
    admin
      .from('capital_requests')
      .select('id, amount, remove_membership, created_at, members:members!capital_requests_member_id_fkey(full_name, email)')
      .eq('status', 'pending')
      .order('created_at', { ascending: true }),
    admin
      .from('report_requests')
      .select('id, report_type, period_from, period_to, status, created_at, members:members!report_requests_member_id_fkey(full_name, email)')
      .eq('status', 'pending')
      .order('created_at', { ascending: true }),
    admin
      .from('members')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active'),
  ])

  const pendingMembers = members.data ?? []
  const pendingSavings = savings.data ?? []
  const pendingRepayments = repayments.data ?? []
  const reviewLoans = loans.data ?? []
  const pendingCapital = capitalRequests.data ?? []
  const pendingReports = reports.data ?? []
  const pendingLoanReports = pendingReports.filter((report) => report.report_type === 'loan')
  const pendingSavingReports = pendingReports.filter((report) => report.report_type === 'saving')
  const pendingPayments = pendingSavings.length + pendingRepayments.length
  const totalQueue = pendingMembers.length + pendingPayments + reviewLoans.length + pendingCapital.length + pendingReports.length
  const queueCards = [
    { label: 'សមាជិក', value: pendingMembers.length, href: '/admin/members', icon: Users, color: 'bg-blue-50 text-blue-700' },
    { label: 'ការសន្សំ', value: pendingSavings.length + pendingSavingReports.length, href: '/admin/savings', icon: PiggyBank, color: 'bg-green-50 text-green-700' },
    { label: 'ការសងកម្ជី', value: pendingRepayments.length, href: '/admin/payments', icon: CreditCard, color: 'bg-emerald-50 text-emerald-700' },
    { label: 'កម្ជី', value: reviewLoans.length, href: '/admin/loans', icon: CreditCard, color: 'bg-orange-50 text-orange-700' },
    { label: 'ដើមទុន', value: pendingCapital.length, href: '/admin/capital', icon: Wallet, color: 'bg-purple-50 text-purple-700' },
    { label: 'របាយការណ៍', value: pendingLoanReports.length, href: '/admin/reports', icon: FileText, color: 'bg-sky-50 text-sky-700' },
  ]
  const recentItems = [
    ...pendingMembers.map((item) => ({ type: 'សមាជិក', title: item.full_name, detail: item.email, date: item.created_at, href: '/admin/members' })),
    ...pendingSavings.map((item) => ({ type: 'ការសន្សំ', title: money(item.amount), detail: relatedMemberName(item), date: item.created_at, href: '/admin/savings' })),
    ...pendingRepayments.map((item) => ({ type: 'ការសង', title: money(item.amount), detail: relatedMemberName(item), date: item.created_at, href: '/admin/payments' })),
    ...reviewLoans.map((item) => ({ type: 'កម្ជី', title: money(item.amount), detail: relatedMemberName(item), date: item.created_at, href: '/admin/loans' })),
    ...pendingCapital.map((item) => ({ type: 'ដើមទុន', title: money(item.amount), detail: relatedMemberName(item), date: item.created_at, href: '/admin/capital' })),
    ...pendingLoanReports.map((item) => ({ type: 'របាយការណ៍', title: `របាយការណ៍ ${item.report_type}`, detail: relatedMemberName(item), date: item.created_at, href: '/admin/reports' })),
    ...pendingSavingReports.map((item) => ({ type: 'របាយការណ៍សន្សំ', title: `របាយការណ៍ ${item.report_type}`, detail: relatedMemberName(item), date: item.created_at, href: '/admin/savings' })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 8)

  return (
    <main className="space-y-8 p-6 md:p-8 max-w-7xl mx-auto">
      <section className="bg-blue-900 text-white rounded-xl p-5 md:p-6 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-blue-200 text-sm font-medium">ការងារសម្រាប់ថ្ងៃនេះ</p>
          <h2 className="text-2xl md:text-3xl font-bold mt-1">
            {totalQueue} ការងារកំពុងរង់ចាំ
          </h2>
          <p className="text-blue-100 text-sm mt-2">
            ត្រួតពិនិត្យសមាជិក ការបង់ប្រាក់ កម្ជី ការស្នើសុំដើមទុន និង របាយការណ៍។
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {[
            { label: 'សមាជិកសកម្ម', value: activeMembers.count ?? 0 },
            { label: 'ការបង់ប្រាក់', value: pendingPayments },
            { label: 'កម្ជី', value: reviewLoans.length },
          ].map((item) => (
            <div key={item.label} className="rounded-lg bg-white/20 px-4 py-3 text-center">
              <p className="text-2xl font-bold">{item.value}</p>
              <p className="text-xs text-blue-100">{item.label}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        {queueCards.map((item) => {
          const Icon = item.icon
          return (
            <Link key={item.href} href={item.href} className="group">
              <Card className="h-full transition-all group-hover:-translate-y-0.5 group-hover:shadow-lg">
                <div className={`mb-5 inline-flex rounded-xl p-3 ${item.color}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-3xl font-bold text-gray-900">{item.value}</p>
                    <p className="text-sm text-gray-500">{item.label}</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-300 transition-colors group-hover:text-blue-700" />
                </div>
              </Card>
            </Link>
          )
        })}
      </div>

      <Card>
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">សកម្មភាពកំពុងរង់ចាំថ្មីៗ</h2>
            <p className="text-sm text-gray-500">ការងារកំពុងរង់ចាំចុងក្រោយបំផុតពីគ្រប់ដំណើរការ។</p>
          </div>
        </div>
        <div className="divide-y divide-gray-100">
          {recentItems.length === 0 && <p className="py-8 text-center text-sm text-gray-500">គ្មានការងារកំពុងរង់ចាំ។</p>}
          {recentItems.map((item, index) => (
            <Link key={`${item.type}-${index}`} href={item.href} className="flex items-center justify-between gap-4 py-4 hover:bg-gray-50">
              <div>
                <p className="text-sm font-semibold text-gray-900">{item.type} • {item.title}</p>
                <p className="text-sm text-gray-500">{item.detail}</p>
              </div>
              <div className="text-right text-xs text-gray-400">{formatDate(item.date)}</div>
            </Link>
          ))}
        </div>
      </Card>
    </main>
  )
}
