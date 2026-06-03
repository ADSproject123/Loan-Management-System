import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { createAdminClient } from '@/lib/supabase/admin'
import { formatDate, money, relatedMemberName } from '@/app/admin/adminUtils'
import { ArrowRight, CreditCard, FileText, PiggyBank, Users } from 'lucide-react'

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
    { label: 'សមាជិក', value: pendingMembers.length, href: '/admin/members/requests', icon: Users, color: 'bg-blue-50 text-blue-700' },
    { label: 'ការសន្សំ', value: pendingSavings.length, href: '/admin/savings/requests', icon: PiggyBank, color: 'bg-green-50 text-green-700' },
    { label: 'ការសងកម្ជី', value: pendingRepayments.length, href: '/admin/loans/payments?status=pending', icon: CreditCard, color: 'bg-emerald-50 text-emerald-700' },
    { label: 'កម្ជី', value: reviewLoans.length, href: '/admin/loans/requests', icon: CreditCard, color: 'bg-orange-50 text-orange-700' },
    { label: 'ដកដើមទុន', value: pendingCapital.length, href: '/admin/savings/capital', icon: PiggyBank, color: 'bg-purple-50 text-purple-700' },
    { label: 'របាយការណ៍', value: pendingLoanReports.length, href: '/admin/reports/loans', icon: FileText, color: 'bg-sky-50 text-sky-700' },
  ]
  const recentItems = [
    ...pendingMembers.map((item) => ({ type: 'សមាជិក', title: item.full_name, detail: item.email, date: item.created_at, href: '/admin/members/requests' })),
    ...pendingSavings.map((item) => ({ type: 'ការសន្សំ', title: money(item.amount), detail: relatedMemberName(item), date: item.created_at, href: '/admin/savings/requests' })),
    ...pendingRepayments.map((item) => ({ type: 'ការសង', title: money(item.amount), detail: relatedMemberName(item), date: item.created_at, href: '/admin/loans/payments?status=pending' })),
    ...reviewLoans.map((item) => ({ type: 'កម្ជី', title: money(item.amount), detail: relatedMemberName(item), date: item.created_at, href: '/admin/loans/requests' })),
    ...pendingCapital.map((item) => ({ type: 'ដកដើមទុន', title: money(item.amount), detail: relatedMemberName(item), date: item.created_at, href: '/admin/savings/capital' })),
    ...pendingLoanReports.map((item) => ({ type: 'របាយការណ៍', title: `របាយការណ៍ ${item.report_type}`, detail: relatedMemberName(item), date: item.created_at, href: '/admin/reports/loans' })),
    ...pendingSavingReports.map((item) => ({ type: 'របាយការណ៍សន្សំ', title: `របាយការណ៍ ${item.report_type}`, detail: relatedMemberName(item), date: item.created_at, href: '/admin/reports/savings' })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 8)

  return (
    <main className="mx-auto max-w-7xl space-y-8 p-6 md:p-10">
      <section className="rounded-2xl bg-blue-900 p-6 text-white shadow-lg ring-1 ring-slate-900/10 md:p-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-blue-200">ផ្ទាំងគ្រប់គ្រង</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
              {totalQueue} ការងាររង់ចាំ
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-blue-100/90">
              ត្រួតពិនិត្យសមាជិក ការបង់ប្រាក់ កម្ជី ដើមទុន និង របាយការណ៍ — ចាប់ពីកាតខាងក្រោម។
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'សមាជិកសកម្ម', value: activeMembers.count ?? 0 },
              { label: 'បង់ប្រាក់', value: pendingPayments },
              { label: 'កម្ជី', value: reviewLoans.length },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-xl bg-white/10 px-4 py-3 text-center ring-1 ring-white/15 backdrop-blur-sm"
              >
                <p className="text-2xl font-bold tabular-nums">{item.value}</p>
                <p className="mt-0.5 text-[11px] font-medium text-blue-100">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {queueCards.map((item) => {
          const Icon = item.icon
          return (
            <Link key={item.href} href={item.href} className="group cursor-pointer">
              <Card className="h-full transition-all duration-200 group-hover:-translate-y-0.5 group-hover:border-blue-200 group-hover:shadow-md">
                <div className={`mb-4 inline-flex rounded-xl p-3 ring-1 ring-black/5 ${item.color}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div className="flex items-end justify-between gap-2">
                  <div>
                    <p className="text-3xl font-bold tabular-nums text-slate-900">{item.value}</p>
                    <p className="text-sm font-medium text-slate-500">{item.label}</p>
                  </div>
                  <ArrowRight className="h-5 w-5 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-blue-700" />
                </div>
              </Card>
            </Link>
          )
        })}
      </div>

      <Card>
        <div className="mb-5">
          <h2 className="text-lg font-bold text-slate-900">សកម្មភាពថ្មីៗ</h2>
          <p className="mt-1 text-sm text-slate-500">រង់ចាំចុងក្រោយបំផុតពីគ្រប់ផ្នែក</p>
        </div>
        <div className="divide-y divide-slate-100">
          {recentItems.length === 0 && (
            <p className="py-10 text-center text-sm text-slate-500">គ្មានការងារកំពុងរង់ចាំ — ល្អណាស់។</p>
          )}
          {recentItems.map((item, index) => (
            <Link
              key={`${item.type}-${index}`}
              href={item.href}
              className="flex cursor-pointer items-center justify-between gap-4 rounded-xl py-4 transition hover:bg-slate-50"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">
                  {item.type} · {item.title}
                </p>
                <p className="truncate text-sm text-slate-500">{item.detail}</p>
              </div>
              <span className="shrink-0 text-xs font-medium text-slate-400">{formatDate(item.date)}</span>
            </Link>
          ))}
        </div>
      </Card>
    </main>
  )
}
