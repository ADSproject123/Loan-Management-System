'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  CheckCircle2,
  FileCheck2,
  FileText,
  History,
  Info,
  XCircle,
} from 'lucide-react'
import { LoanStatusBadge, SavingStatusBadge } from '@/components/ui/Badge'
import { formatDate, money, relatedMemberName } from '@/app/admin/adminUtils'
import { memberKhmerName } from '@/lib/memberNames'
import { LoanActions } from '@/app/admin/loans/LoanActions'
import { LoanPaymentSchedule } from '@/components/loans/LoanPaymentSchedule'
import type { CurrencyCode } from '@/lib/currency'
import type { LoanScheduleRow } from '@/lib/interestCalculations'
import type { LoanStatus, SavingStatus } from '@/types/database'
import type { AdminLoanDetailRecord } from '@/lib/admin/loanDetail'
import {
  AdminBackLink,
  AdminPanel,
  adminTable,
} from '@/components/admin'

type DocChecklistItem = {
  label: string
  done: boolean
  detail: string
  href?: string | null
}

type RepaymentRow = {
  id: string
  amount: number | null
  currency: string | null
  status: string
  payment_date: string | null
  created_at: string
}

type MemberSummary = {
  id?: string
  full_name?: string
  full_name_kh?: string | null
  email?: string
  phone?: string | null
}

type RefereeSummary = {
  id: string
  full_name: string
  full_name_kh?: string | null
  full_name_en?: string | null
  email?: string
  phone?: string | null
}

type ApproverSummary = {
  id: string
  full_name: string
}

type LoanDetailViewProps = {
  loan: AdminLoanDetailRecord
  currency: CurrencyCode
  member?: MemberSummary | null
  referee?: RefereeSummary | null
  approver?: ApproverSummary | null
  refereeNameKh: string | null
  refereeNameEn: string | null
  refereePhone: string | null
  refereeEmail: string | null
  hasRefereeInfo: boolean
  docChecklist: DocChecklistItem[]
  docsComplete: boolean
  loanRate: number
  paymentSchedule: LoanScheduleRow[]
  repayments: RepaymentRow[]
}

type TabId = 'info' | 'schedule' | 'history' | 'documents'

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'info',      label: 'ព័ត៌មាន',    icon: <Info className="h-4 w-4" /> },
  { id: 'schedule',  label: 'តារាបង់',    icon: <FileText className="h-4 w-4" /> },
  { id: 'history',   label: 'ប្រវត្តិ',   icon: <History className="h-4 w-4" /> },
  { id: 'documents', label: 'ឯកសារ',     icon: <FileCheck2 className="h-4 w-4" /> },
]

const ACTIONABLE_STATUSES: LoanStatus[] = ['pending', 'under_review', 'approved']

const ACTION_HINT: Partial<Record<LoanStatus, string>> = {
  pending:      'ពិនិត្យពាក្យសុំ រួច ទទួលយក ឬ បដិសេធ។',
  under_review: 'ពិនិត្យពាក្យសុំ រួច ទទួលយក ឬ បដិសេធ។',
  approved:     'ទទួលយករួចហើយ — ចុចដំណើរការដើម្បីបើកកម្ជីជាសកម្ម។',
}

export function LoanDetailView({
  loan,
  currency,
  member,
  referee,
  approver,
  refereeNameKh,
  refereeNameEn,
  refereePhone,
  refereeEmail,
  hasRefereeInfo,
  docChecklist,
  loanRate,
  paymentSchedule,
  repayments,
}: LoanDetailViewProps) {
  const [activeTab, setActiveTab] = useState<TabId>('info')

  const status = loan.status as LoanStatus
  const memberName = memberKhmerName(member ?? { full_name: relatedMemberName({ members: member }) })
  const refereeDisplayName =
    memberKhmerName(referee) !== 'សមាជិកមិនស្គាល់'
      ? memberKhmerName(referee)
      : refereeNameKh || memberKhmerName({ full_name: referee?.full_name })
  const needsAction = ACTIONABLE_STATUSES.includes(status)

  return (
    <main>
      <AdminPanel title={memberName}>

        {/* ── Header ── */}
        <header className="flex flex-col gap-4 border-b border-border px-6 py-4 md:flex-row md:items-center md:justify-between md:px-8">
          <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <AdminBackLink href="/admin/loans">ត្រឡប់ក្រោយ</AdminBackLink>
            <div className="hidden h-6 w-px bg-border sm:block" aria-hidden />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">{memberName}</p>
              <p className="text-xs text-muted">ដាក់ស្នើ {formatDate(loan.created_at)}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <LoanStatusBadge status={status} plain />
            <LoanActions loanId={loan.id} status={status} />
          </div>
        </header>

        {/* ── Alerts ── */}
        {needsAction && (
          <div className="mx-6 mt-4 rounded-xl border border-brand-200 bg-brand-50/70 px-4 py-3 md:mx-8">
            <p className="text-sm text-brand-900">{ACTION_HINT[status]}</p>
          </div>
        )}
        {status === 'rejected' && loan.rejection_reason && (
          <div className="mx-6 mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-4 md:mx-8">
            <p className="text-sm font-semibold text-red-950">មូលហេតុបដិសេធ</p>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-red-900">
              {loan.rejection_reason}
            </p>
            {loan.rejected_at && (
              <p className="mt-2 text-xs text-red-700">បដិសេធនៅ {formatDate(loan.rejected_at)}</p>
            )}
          </div>
        )}

        <div className="space-y-6 px-6 py-6 md:px-8">

          {/* ── Tabs ── */}
          <div className="flex min-h-0 flex-1 flex-col">
            <nav
              className="w-full overflow-x-auto rounded-t-2xl border border-b-0 border-border bg-surface shadow-sm"
              aria-label="ផ្ទាំងព័ត៌មានកម្ជី"
            >
              <div className="flex w-full min-w-max sm:min-w-0">
                {TABS.map((tab) => {
                  const isActive = activeTab === tab.id
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex flex-1 items-center justify-center gap-2 border-b-2 px-4 py-4 text-sm font-semibold transition sm:px-6 ${
                        isActive
                          ? 'border-brand-900 text-brand-900'
                          : 'border-transparent text-muted hover:border-border hover:bg-surface-muted hover:text-foreground'
                      }`}
                    >
                      <span className={isActive ? 'text-brand-900' : 'text-muted'}>{tab.icon}</span>
                      {tab.label}
                    </button>
                  )
                })}
              </div>
            </nav>

            <div className="rounded-b-2xl border border-border bg-surface shadow-sm">
              <div className="p-6 md:p-8">

                {/* ── Tab: ព័ត៌មាន ── */}
                {activeTab === 'info' && (
                  <dl className="divide-y divide-border">
                    {/* Member */}
                    <InfoRow label="ឈ្មោះ">
                      <Link
                        href={`/admin/members/${loan.member_id}`}
                        className="font-medium text-brand-700 hover:underline"
                      >
                        {memberName}
                      </Link>
                    </InfoRow>
                    {member?.phone && (
                      <InfoRow label="លេខទូរស័ព្ទ"><span>{member.phone}</span></InfoRow>
                    )}
                    {member?.email && (
                      <InfoRow label="អ៊ីមែល"><span>{member.email}</span></InfoRow>
                    )}

                    <InfoRow label="រូបិយប័ណ្ណ"><span>{currency}</span></InfoRow>
                    <InfoRow label="ចំនួនកម្ជី"><span className="font-semibold">{money(loan.amount, currency)}</span></InfoRow>
                    <InfoRow label="រយៈពេល"><span>{loan.term_months ?? 0} ខែ</span></InfoRow>
                    <InfoRow label="អត្រាការប្រាក់"><span>{loanRate}% / ខែ</span></InfoRow>
                    {loan.start_date && (
                      <InfoRow label="ថ្ងៃចាប់ផ្តើម"><span>{formatDate(loan.start_date)}</span></InfoRow>
                    )}
                    {loan.due_date && (
                      <InfoRow label="ថ្ងៃកំណត់"><span>{formatDate(loan.due_date)}</span></InfoRow>
                    )}
                    {approver?.full_name && (
                      <InfoRow label="ទទួលដោយ"><span>{approver.full_name}</span></InfoRow>
                    )}
                    {loan.purpose && (
                      <InfoRow label="គោលបំណង"><span className="leading-relaxed">{loan.purpose}</span></InfoRow>
                    )}

                    {/* Referee */}
                    {hasRefereeInfo && (
                      <InfoRow label="អ្នកធានា">
                        <div className="space-y-0.5">
                          {refereeDisplayName && (
                            <p className="font-medium text-foreground">{refereeDisplayName}</p>
                          )}
                          {(referee?.phone || refereePhone) && (
                            <p className="text-sm text-muted">{referee?.phone ?? refereePhone}</p>
                          )}
                          {(referee?.email || refereeEmail) && (
                            <p className="text-sm text-muted">{referee?.email ?? refereeEmail}</p>
                          )}
                          <div className="flex items-center gap-3 pt-1">
                            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                              loan.referee_verified ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                            }`}>
                              {loan.referee_verified ? 'បានបញ្ជាក់' : 'រង់ចាំ'}
                            </span>
                            {referee && (
                              <Link
                                href={`/admin/members/${referee.id}`}
                                className="text-xs font-medium text-brand-700 hover:underline"
                              >
                                មើលប្រវត្តិ →
                              </Link>
                            )}
                          </div>
                        </div>
                      </InfoRow>
                    )}
                  </dl>
                )}

                {/* ── Tab: តារាបង់ ── */}
                {activeTab === 'schedule' && (
                  paymentSchedule.length > 0 ? (
                    <LoanPaymentSchedule
                      schedule={paymentSchedule}
                      currency={currency}
                      fileBaseName={`loan-${loan.id}-schedule`}
                      memberName={memberName}
                      showDownload
                    />
                  ) : (
                    <p className="text-sm text-muted">មិនទាន់មានតារាបង់ទេ។</p>
                  )
                )}

                {/* ── Tab: ប្រវត្តិ ── */}
                {activeTab === 'history' && (
                  repayments.length === 0 ? (
                    <p className="text-sm text-muted">មិនទាន់មានការសងកម្ជីទេ។</p>
                  ) : (
                    <div className={adminTable.wrap}>
                      <table className={adminTable.table}>
                        <thead className={adminTable.thead}>
                          <tr className={adminTable.thRow}>
                            <th className={adminTable.thFirst}>ចំនួន</th>
                            <th className={adminTable.th}>ថ្ងៃបង់</th>
                            <th className={adminTable.th}>ស្ថានភាព</th>
                            <th className={adminTable.thLast}>ដាក់ស្នើ</th>
                          </tr>
                        </thead>
                        <tbody className={adminTable.tbody}>
                          {repayments.map((r) => (
                            <tr key={r.id} className={adminTable.tr}>
                              <td className={`${adminTable.tdFirst} ${adminTable.amountPrimary}`}>
                                {money(r.amount, currency)}
                              </td>
                              <td className={adminTable.tdMuted}>{formatDate(r.payment_date)}</td>
                              <td className={adminTable.td}>
                                <SavingStatusBadge status={r.status as SavingStatus} plain />
                              </td>
                              <td className={adminTable.tdLast}>{formatDate(r.created_at)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )
                )}

                {/* ── Tab: ឯកសារ ── */}
                {activeTab === 'documents' && (
                  <ul className="space-y-3">
                    {docChecklist.map((item) => (
                      <li key={item.label} className="flex items-start gap-3 rounded-xl border border-border bg-surface-muted/30 p-4">
                        {item.done ? (
                          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                        ) : (
                          <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-slate-300" />
                        )}
                        <div className="min-w-0">
                          <p className={`text-sm font-medium ${item.done ? 'text-foreground' : 'text-muted'}`}>
                            {item.label}
                          </p>
                          {item.href ? (
                            <a
                              href={item.href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-0.5 inline-block text-xs text-brand-700 hover:underline"
                            >
                              {item.detail}
                            </a>
                          ) : (
                            <p className="mt-0.5 text-xs text-muted">{item.detail}</p>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}

              </div>
            </div>
          </div>

        </div>
      </AdminPanel>
    </main>
  )
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-6 py-3 first:pt-0 last:pb-0">
      <dt className="w-96 shrink-0 text-sm text-muted">{label}</dt>
      <dd className="min-w-0 flex-1 text-sm text-foreground">{children}</dd>
    </div>
  )
}

function MetricCard({
  icon: Icon,
  label,
  value,
  hint,
  accent = 'default',
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  hint: string
  accent?: 'default' | 'success' | 'warning'
}) {
  const accentClass =
    accent === 'success'
      ? 'text-emerald-600'
      : accent === 'warning'
        ? 'text-amber-600'
        : 'text-foreground'

  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
          <p className={`mt-2 truncate text-2xl font-bold tabular-nums ${accentClass}`}>{value}</p>
          <p className="mt-1 line-clamp-2 text-xs text-muted">{hint}</p>
        </div>
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700 ring-1 ring-brand-100">
          <Icon className="h-4 w-4" />
        </span>
      </div>
    </div>
  )
}

