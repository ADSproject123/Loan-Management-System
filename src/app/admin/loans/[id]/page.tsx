import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Calendar, CheckCircle2, Mail, User, XCircle } from 'lucide-react'
import { LoanStatusBadge, SavingStatusBadge } from '@/components/ui/Badge'
import { createAdminClient } from '@/lib/supabase/admin'
import { getPrivateFileUrl } from '@/lib/uploads'
import { formatDate, money, relatedMemberName } from '@/app/admin/adminUtils'
import { LoanActions } from '@/app/admin/loans/LoanActions'
import { normalizeCurrency, type CurrencyCode } from '@/lib/currency'
import type { LoanStatus, SavingStatus } from '@/types/database'
import {
  AdminBackLink,
  AdminDetailCard,
  AdminDetailItem,
  AdminExternalLink,
  AdminHeroPanel,
  AdminStatusPill,
} from '@/components/admin'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function AdminLoanDetailPage({ params }: PageProps) {
  const { id } = await params
  const admin = createAdminClient()

  const { data: loan } = await admin
    .from('loans')
    .select(
      `id, member_id, amount, currency, purpose, term_months, interest_rate, status,
      referee_id, referee_verified, support_document_url, hard_copy_submitted, thumbprint_submitted,
      approved_at, disbursed_at, due_date, rejection_reason, rejected_at, created_at, updated_at,
      members:members!loans_member_id_fkey(id, full_name, full_name_kh, email, phone),
      referee:referee_id(id, full_name, email, phone),
      approver:approved_by(id, full_name)`
    )
    .eq('id', id)
    .maybeSingle()

  if (!loan) notFound()

  const [{ data: repayments }, supportDocumentUrl] = await Promise.all([
    admin
      .from('loan_repayments')
      .select('id, amount, currency, status, payment_date, created_at')
      .eq('loan_id', id)
      .order('created_at', { ascending: false })
      .limit(10),
    getPrivateFileUrl(loan.support_document_url),
  ])

  const currency = normalizeCurrency(loan.currency) as CurrencyCode
  const member = Array.isArray(loan.members) ? loan.members[0] : loan.members
  const referee = Array.isArray(loan.referee) ? loan.referee[0] : loan.referee
  const approver = Array.isArray(loan.approver) ? loan.approver[0] : loan.approver

  const docChecklist = [
    {
      label: 'ឯកសារគាំទ្រ',
      done: Boolean(loan.support_document_url),
      detail: loan.support_document_url ? 'បានផ្ទុក' : 'មិនបានផ្ទុក',
      href: supportDocumentUrl,
    },
    {
      label: 'ច្បាប់ដើម',
      done: Boolean(loan.hard_copy_submitted),
      detail: loan.hard_copy_submitted ? 'បានទទួល' : 'រង់ចាំ',
    },
    {
      label: 'ការផ្តិតមេដៃ',
      done: Boolean(loan.thumbprint_submitted),
      detail: loan.thumbprint_submitted ? 'បានទទួល' : 'រង់ចាំ',
    },
    {
      label: 'អ្នកបញ្ជាក់',
      done: Boolean(referee) && loan.referee_verified,
      detail: referee
        ? loan.referee_verified
          ? 'បានបញ្ជាក់'
          : 'រង់ចាំការបញ្ជាក់'
        : 'មិនបានដាក់',
    },
  ]

  const docsComplete = docChecklist.every((item) => item.done)

  return (
    <main className="w-full space-y-6 p-6 md:p-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <AdminBackLink href="/admin/loans">ត្រឡប់ទៅបញ្ជីកម្ជី</AdminBackLink>
          <div className="hidden h-6 w-px bg-gray-200 sm:block" aria-hidden />
          <p className="text-sm text-gray-500">លម្អិតពាក្យសុំកម្ជី</p>
        </div>
        <LoanActions loanId={loan.id} status={loan.status as LoanStatus} className="justify-start lg:justify-end" />
      </div>

      <AdminHeroPanel
        aside={
          <div className="shrink-0 bg-gray-50 p-5 ring-1 ring-gray-100 lg:min-w-64">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">សមាជិក</p>
            <Link href={`/admin/members/${loan.member_id}`} className="group mt-2 block">
              <p className="font-semibold text-gray-900 transition group-hover:text-blue-700">
                {member?.full_name_kh ?? member?.full_name ?? relatedMemberName({ members: member })}
              </p>
              {member?.email && (
                <p className="mt-1 inline-flex items-center gap-1.5 truncate text-sm text-gray-500">
                  <Mail className="h-3.5 w-3.5 shrink-0" />
                  {member.email}
                </p>
              )}
            </Link>
          </div>
        }
      >
        <LoanStatusBadge status={loan.status as LoanStatus} />
        <p className="mt-3 text-3xl font-bold tabular-nums tracking-tight text-gray-900 md:text-4xl">
          {money(loan.amount, currency)}
        </p>
        <p className="mt-3 text-base leading-relaxed text-gray-700">
          {loan.purpose || 'គ្មានគោលបំណងបានបញ្ជាក់'}
        </p>
        <p className="mt-2 text-sm text-gray-500">ដាក់ស្នើ {formatDate(loan.created_at)}</p>
      </AdminHeroPanel>

      {loan.status === 'rejected' && loan.rejection_reason && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4">
          <p className="text-sm font-semibold text-red-950">មូលហេតុបដិសេធ</p>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-red-900">{loan.rejection_reason}</p>
          {loan.rejected_at && (
            <p className="mt-2 text-xs text-red-700">បដិសេធនៅ {formatDate(loan.rejected_at)}</p>
          )}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <AdminDetailCard title="លក្ខខណ្ឌកម្ជី">
          <dl className="grid gap-4 sm:grid-cols-2">
            <AdminDetailItem label="រយៈពេល" value={`${loan.term_months ?? 0} ខែ`} />
            <AdminDetailItem label="អត្រាការប្រាក់" value={`${loan.interest_rate ?? 0}% / ខែ`} />
            <AdminDetailItem label="រូបិយប័ណ្ណ" value={currency} />
            <AdminDetailItem
              label="ឯកសារពេញលេញ"
              value={docsComplete ? 'បានគ្រប់' : 'មិនទាន់គ្រប់'}
            />
          </dl>
        </AdminDetailCard>

        <AdminDetailCard title="កាលបរិច្ឆេទ">
          <dl className="grid gap-4">
            <AdminDetailItem label="ដាក់ស្នើ" value={formatDate(loan.created_at)} icon={Calendar} />
            <AdminDetailItem label="ទទួលយក" value={formatDate(loan.approved_at)} icon={Calendar} />
            <AdminDetailItem label="បើកប្រាក់" value={formatDate(loan.disbursed_at)} icon={Calendar} />
            <AdminDetailItem label="កាលបរិច្ឆេទបង់" value={formatDate(loan.due_date)} icon={Calendar} />
            {approver?.full_name && (
              <AdminDetailItem label="អនុម័តដោយ" value={approver.full_name} icon={User} />
            )}
          </dl>
        </AdminDetailCard>
      </div>

      <AdminDetailCard title="ឯកសារ និងការផ្ទៀងផ្ទាត់">
        <ul className="divide-y divide-gray-100">
          {docChecklist.map((item) => (
            <li key={item.label} className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0">
              <div className="flex items-center gap-3">
                {item.done ? (
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
                ) : (
                  <XCircle className="h-5 w-5 shrink-0 text-gray-300" />
                )}
                <div>
                  <p className="font-medium text-gray-900">{item.label}</p>
                  <p className="text-sm text-gray-500">{item.detail}</p>
                </div>
              </div>
              {'href' in item && item.href ? (
                <AdminExternalLink href={item.href}>មើល</AdminExternalLink>
              ) : null}
            </li>
          ))}
        </ul>
      </AdminDetailCard>

      {referee && (
        <AdminDetailCard title="អ្នកបញ្ជាក់">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="font-semibold text-gray-900">{referee.full_name}</p>
              <p className="mt-1 text-sm text-gray-500">{referee.email}</p>
              {referee.phone && <p className="mt-1 text-sm text-gray-500">{referee.phone}</p>}
            </div>
            <AdminStatusPill variant={loan.referee_verified ? 'success' : 'warning'}>
              {loan.referee_verified ? 'បានបញ្ជាក់' : 'រង់ចាំ'}
            </AdminStatusPill>
          </div>
        </AdminDetailCard>
      )}

      <AdminDetailCard title="ប្រវត្តិសងកម្ជី">
        {(repayments ?? []).length === 0 ? (
          <p className="text-sm text-gray-500">មិនទាន់មានការសងកម្ជីទេ។</p>
        ) : (
          <div className="-mx-6 overflow-x-auto md:-mx-8">
            <table className="w-full min-w-120 text-left text-sm">
              <thead className="border-y border-gray-100 bg-gray-50/80">
                <tr className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <th className="px-6 py-3 md:px-8">ចំនួន</th>
                  <th className="px-6 py-3">ថ្ងៃបង់</th>
                  <th className="px-6 py-3">ស្ថានភាព</th>
                  <th className="px-6 py-3 md:px-8">ដាក់ស្នើ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(repayments ?? []).map((repayment) => (
                  <tr key={repayment.id}>
                    <td className="px-6 py-3 font-semibold tabular-nums text-gray-900 md:px-8">
                      {money(repayment.amount, normalizeCurrency(repayment.currency))}
                    </td>
                    <td className="px-6 py-3 text-gray-600">{formatDate(repayment.payment_date)}</td>
                    <td className="px-6 py-3">
                      <SavingStatusBadge status={repayment.status as SavingStatus} />
                    </td>
                    <td className="px-6 py-3 text-gray-500 md:px-8">
                      {formatDate(repayment.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminDetailCard>
    </main>
  )
}
