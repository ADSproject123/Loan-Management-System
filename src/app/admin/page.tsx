import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { createAdminClient } from '@/lib/supabase/admin'
import { formatDate, money, relatedMemberName, sumByCurrency } from '@/app/admin/adminUtils'
import {
  buildMonthlySavingsChartData,
  isVerifiedSavingForChart,
  type SavingChartSourceRow,
} from '@/lib/admin/savingsChartData'
import { SavingsAmountChart } from '@/app/admin/SavingsAmountChart'
import { AdminStatCard } from '@/components/admin'
import { CreditCard, Landmark, PiggyBank, Users, Wallet } from 'lucide-react'

export default async function AdminPage() {
  const admin = createAdminClient()

  const [
    membersPending,
    savingsPending,
    repaymentsPending,
    loansReview,
    capitalPending,
    reportsPending,
    membersTotal,
    membersActive,
    membersPendingCount,
    allSavings,
    allLoans,
    activeLoans,
    completedRepayments,
    loansTotalCount,
    loansActiveCount,
  ] = await Promise.all([
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
      .select(
        'id, report_type, period_from, period_to, status, created_at, members:members!report_requests_member_id_fkey(full_name, email)'
      )
      .eq('status', 'pending')
      .order('created_at', { ascending: true }),
    admin.from('members').select('id', { count: 'exact', head: true }),
    admin.from('members').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    admin.from('members').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    admin
      .from('savings')
      .select('amount, currency, status, verified_at, verified_by, saving_date, created_at'),
    admin.from('loans').select('amount, currency, status'),
    admin.from('loans').select('amount, currency').eq('status', 'active'),
    admin.from('loan_repayments').select('amount, currency').eq('status', 'completed'),
    admin.from('loans').select('id', { count: 'exact', head: true }),
    admin.from('loans').select('id', { count: 'exact', head: true }).eq('status', 'active'),
  ])

  const pendingMembers = membersPending.data ?? []
  const pendingSavings = savingsPending.data ?? []
  const pendingRepayments = repaymentsPending.data ?? []
  const reviewLoans = loansReview.data ?? []
  const pendingCapital = capitalPending.data ?? []
  const pendingReports = reportsPending.data ?? []
  const pendingLoanReports = pendingReports.filter((report) => report.report_type === 'loan')
  const pendingSavingReports = pendingReports.filter((report) => report.report_type === 'saving')

  const savingsRows = (allSavings.data ?? []) as SavingChartSourceRow[]
  const verifiedSavings = savingsRows.filter(isVerifiedSavingForChart)
  const verifiedSavingsTotals = sumByCurrency(verifiedSavings)
  const savingsChartData = buildMonthlySavingsChartData(savingsRows)
  const activeLoanTotals = sumByCurrency(activeLoans.data ?? [])
  const repaymentTotals = sumByCurrency(completedRepayments.data ?? [])
  const loanPortfolioTotals = sumByCurrency(
    (allLoans.data ?? []).filter((loan) => loan.status === 'active' || loan.status === 'approved')
  )

  const totalMembers = membersTotal.count ?? 0
  const activeMembers = membersActive.count ?? 0
  const pendingMemberTotal = membersPendingCount.count ?? 0
  const totalLoans = loansTotalCount.count ?? 0
  const activeLoansCount = loansActiveCount.count ?? 0
  const verifiedSavingsCount = verifiedSavings.length

  const recentItems = [
    ...pendingMembers.map((item) => ({
      type: 'សមាជិក',
      title: item.full_name,
      detail: item.email,
      date: item.created_at,
      href: '/admin/members/requests',
    })),
    ...pendingSavings.map((item) => ({
      type: 'ការសន្សំ',
      title: money(item.amount),
      detail: relatedMemberName(item),
      date: item.created_at,
      href: '/admin/savings/requests',
    })),
    ...pendingRepayments.map((item) => ({
      type: 'ការសង',
      title: money(item.amount),
      detail: relatedMemberName(item),
      date: item.created_at,
      href: '/admin/loans/payments?status=pending',
    })),
    ...reviewLoans.map((item) => ({
      type: 'កម្ជី',
      title: money(item.amount),
      detail: relatedMemberName(item),
      date: item.created_at,
      href: '/admin/loans/requests',
    })),
    ...pendingCapital.map((item) => ({
      type: 'ដកដើមទុន',
      title: money(item.amount),
      detail: relatedMemberName(item),
      date: item.created_at,
      href: '/admin/savings/capital',
    })),
    ...pendingLoanReports.map((item) => ({
      type: 'របាយការណ៍កម្ជី',
      title: `របាយការណ៍ ${item.report_type}`,
      detail: relatedMemberName(item),
      date: item.created_at,
      href: '/admin/reports/loans',
    })),
    ...pendingSavingReports.map((item) => ({
      type: 'របាយការណ៍សន្សំ',
      title: `របាយការណ៍ ${item.report_type}`,
      detail: relatedMemberName(item),
      date: item.created_at,
      href: '/admin/reports/savings',
    })),
  ]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 8)

  return (
    <main className="w-full space-y-8 p-6 md:p-8">
      <section className="app-hero-banner px-6 py-8 md:px-8">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">ផ្ទាំងគ្រប់គ្រង</h1>
        <p className="mt-2 max-w-2xl text-sm leading-7 text-brand-100 md:text-base">
          ទិដ្ឋភាពរួមនៃសមាជិក សន្សំ កម្ជី និង ការសង — មើលសរុបទឹកប្រាក់តាមរូបិយប័ណ្ណ។
        </p>
      </section>

      <section className="space-y-6">
        <div>
          <p className="mt-1 text-sm text-slate-500">ទិន្នន័យរួមពីគ្រប់សមាជិក</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 *:h-full">
          <AdminStatCard
            label="សមាជិកសកម្ម"
            value={activeMembers}
            subtitle={
              <>
                រង់ចាំចូលរួម{' '}
                <span className="font-semibold tabular-nums">{pendingMemberTotal}</span>
              </>
            }
            icon={Users}
            tone="blue"
          />
          <Link href="/admin/loans" className="block h-full transition hover:opacity-95">
            <AdminStatCard label="កម្ជីទាំងអស់" value={totalLoans} icon={CreditCard} tone="slate" />
          </Link>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700">ផ្នែក USD</h3>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 *:h-full">
            <Link href="/admin/savings" className="block h-full transition hover:opacity-95">
              <AdminStatCard
                label="សន្សំសរុប"
                value={money(verifiedSavingsTotals.USD, 'USD')}
                icon={PiggyBank}
                tone="emerald"
              />
            </Link>
            <Link href="/admin/loans/active" className="block h-full transition hover:opacity-95">
              <AdminStatCard
                label="កម្ជីសកម្ម"
                value={money(activeLoanTotals.USD, 'USD')}
                subtitle={
                  <>
                    ចំនួន{' '}
                    <span className="font-semibold tabular-nums">{activeLoansCount}</span> កម្ជី
                  </>
                }
                icon={Landmark}
                tone="amber"
              />
            </Link>
            <Link href="/admin/loans/payments" className="block h-full transition hover:opacity-95">
              <AdminStatCard
                label="ប្រាក់សងសរុប"
                value={money(repaymentTotals.USD, 'USD')}
                icon={Wallet}
                tone="blue"
              />
            </Link>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700">ផ្នែក KHR</h3>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 *:h-full">
            <Link href="/admin/savings" className="block h-full transition hover:opacity-95">
              <AdminStatCard
                label="សន្សំសរុប"
                value={money(verifiedSavingsTotals.KHR, 'KHR')}
                icon={PiggyBank}
                tone="emerald"
              />
            </Link>
            <Link href="/admin/loans/active" className="block h-full transition hover:opacity-95">
              <AdminStatCard
                label="កម្ជីសកម្ម"
                value={money(activeLoanTotals.KHR, 'KHR')}
                icon={Landmark}
                tone="amber"
              />
            </Link>
            <Link href="/admin/loans/payments" className="block h-full transition hover:opacity-95">
              <AdminStatCard
                label="ប្រាក់សងសរុប"
                value={money(repaymentTotals.KHR, 'KHR')}
                icon={Wallet}
                tone="blue"
              />
            </Link>
          </div>
        </div>

        <p className="text-sm text-slate-500">
          ការសន្សំផ្ទៀងផ្ទាត់{' '}
          <span className="font-semibold text-slate-700">{verifiedSavingsCount}</span> ដំណើរ · កម្ជីអនុម័ត/សកម្ម{' '}
          <span className="font-semibold text-slate-700">
            {money(loanPortfolioTotals.USD, 'USD')} / {money(loanPortfolioTotals.KHR, 'KHR')}
          </span>{' '}
          (អនុម័ត + សកម្ម)
        </p>
      </section>

      <Card>
        <div className="mb-6">
          <h2 className="text-lg font-bold text-slate-900">ក្រាប់ការសន្សំ</h2>
          <p className="mt-1 text-sm text-slate-500">
            ចំនួនដាក់សន្សំផ្ទៀងផ្ទាត់ប្រចាំខែ — ១២ ខែចុងក្រោយ (ប្តូររូបិយប័ណ្ណតាមផ្ទាំង)
          </p>
        </div>
        <SavingsAmountChart data={savingsChartData} />
      </Card>

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
              className="flex cursor-pointer items-center justify-between gap-4 rounded-xl py-4 transition hover:bg-background"
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
