import Link from 'next/link'
import {
  Calendar,
  CheckCircle2,
  CircleDollarSign,
  Clock,
  FileCheck2,
  Landmark,
  Mail,
  Percent,
  Phone,
  User,
  XCircle,
} from 'lucide-react'
import { LoanStatusBadge, SavingStatusBadge } from '@/components/ui/Badge'
import { formatDate, money, relatedMemberName } from '@/app/admin/adminUtils'
import { LoanActions } from '@/app/admin/loans/LoanActions'
import { LoanPaymentSchedule } from '@/components/loans/LoanPaymentSchedule'
import type { CurrencyCode } from '@/lib/currency'
import type { LoanScheduleRow } from '@/lib/interestCalculations'
import type { LoanStatus, SavingStatus } from '@/types/database'
import type { AdminLoanDetailRecord } from '@/lib/admin/loanDetail'
import {
  AdminBackLink,
  AdminExternalLink,
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
  refereeName: string | null
  refereePhone: string | null
  refereeEmail: string | null
  hasRefereeInfo: boolean
  docChecklist: DocChecklistItem[]
  docsComplete: boolean
  loanRate: number
  totalPaid: number
  scheduleTotalDue: number
  paymentSchedule: LoanScheduleRow[]
  repayments: RepaymentRow[]
}

const ACTIONABLE_STATUSES: LoanStatus[] = ['pending', 'under_review', 'approved']

const ACTION_HINT: Partial<Record<LoanStatus, string>> = {
  pending: 'ពិនិត្យពាក្យសុំ រួច ទទួលយក ឬ បដិសេធ។',
  under_review: 'ពិនិត្យពាក្យសុំ រួច ទទួលយក ឬ បដិសេធ។',
  approved: 'ទទួលយករួចហើយ — ចុចដំណើរការដើម្បីបើកកម្ជីជាសកម្ម។',
}

export function LoanDetailView({
  loan,
  currency,
  member,
  referee,
  approver,
  refereeName,
  refereePhone,
  refereeEmail,
  hasRefereeInfo,
  docChecklist,
  docsComplete,
  loanRate,
  totalPaid,
  scheduleTotalDue,
  paymentSchedule,
  repayments,
}: LoanDetailViewProps) {
  const status = loan.status as LoanStatus
  const memberName =
    member?.full_name_kh ?? member?.full_name ?? relatedMemberName({ members: member })
  const docsDoneCount = docChecklist.filter((item) => item.done).length
  const docsPercent = docChecklist.length
    ? Math.round((docsDoneCount / docChecklist.length) * 100)
    : 0
  const remaining = Math.max(scheduleTotalDue - totalPaid, 0)
  const needsAction = ACTIONABLE_STATUSES.includes(status)
  const timeline = buildTimeline(loan)

  return (
    <main>
      <AdminPanel title={memberName}>
        <header className="flex flex-col gap-4 border-b border-border px-6 py-4 md:flex-row md:items-center md:justify-between md:px-8">
          <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <AdminBackLink href="/admin/loans">ត្រឡប់ទៅបញ្ជីកម្ជី</AdminBackLink>
            <div className="hidden h-6 w-px bg-border sm:block" aria-hidden />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">{memberName}</p>
              <p className="text-xs text-muted">
                ដាក់ស្នើ {formatDate(loan.created_at)} · {money(loan.amount, currency)}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <LoanStatusBadge status={status} plain />
            <LoanActions loanId={loan.id} status={status} />
          </div>
        </header>

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
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              icon={CircleDollarSign}
              label="ចំនួនកម្ជី"
              value={money(loan.amount, currency)}
              hint={loan.purpose || 'គ្មានគោលបំណង'}
            />
            <MetricCard
              icon={Clock}
              label="រយៈពេល"
              value={`${loan.term_months ?? 0} ខែ`}
              hint={`អត្រា ${loanRate}% / ខែ`}
            />
            <MetricCard
              icon={Landmark}
              label="បានសង"
              value={money(totalPaid, currency)}
              hint={
                scheduleTotalDue > 0
                  ? `នៅសល់ ${money(remaining, currency)}`
                  : 'មិនទាន់មានតារាបង់'
              }
            />
            <MetricCard
              icon={FileCheck2}
              label="ឯកសារ"
              value={`${docsDoneCount}/${docChecklist.length}`}
              hint={docsComplete ? 'គ្រប់គ្រាន់' : 'មិនទាន់គ្រប់'}
              accent={docsComplete ? 'success' : 'warning'}
            />
          </section>

          <section className="overflow-hidden rounded-2xl border border-border bg-surface ring-1 ring-foreground/5">
            <div className="border-b border-border px-5 py-4 md:px-6">
              <h2 className="text-sm font-semibold text-foreground">ដំណើរការកម្ជី</h2>
            </div>
            <ol className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4 md:px-6 md:pb-6">
              {timeline.map((step, index) => (
                <li key={step.label} className="relative flex gap-3">
                  {index < timeline.length - 1 && (
                    <span
                      className="absolute left-3.5 top-8 hidden h-full w-px bg-border lg:block"
                      aria-hidden
                    />
                  )}
                  <span
                    className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold ${
                      step.done
                        ? 'bg-emerald-100 text-emerald-700'
                        : step.current
                          ? 'bg-brand-100 text-brand-700 ring-2 ring-brand-200'
                          : 'bg-surface-muted text-muted'
                    }`}
                  >
                    {step.done ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
                  </span>
                  <div className="min-w-0 pt-0.5">
                    <p className="text-sm font-medium text-foreground">{step.label}</p>
                    <p className="mt-0.5 text-xs text-muted">
                      {step.date ? formatDate(step.date) : step.placeholder}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              {loan.purpose && (
                <DetailSection title="គោលបំណង">
                  <p className="text-sm leading-relaxed text-foreground">{loan.purpose}</p>
                </DetailSection>
              )}

              {paymentSchedule.length > 0 && (
                  <div className="px-5 pb-5 md:px-6 md:pb-6">
                    <LoanPaymentSchedule schedule={paymentSchedule} currency={currency} compact />
                  </div>
              )}

              <DetailSection title="ប្រវត្តិសងកម្ជី" noPadding>
                {(repayments ?? []).length === 0 ? (
                  <p className="px-5 pb-5 text-sm text-muted md:px-6 md:pb-6">
                    មិនទាន់មានការសងកម្ជីទេ។
                  </p>
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
                        {repayments.map((repayment) => (
                          <tr key={repayment.id} className={adminTable.tr}>
                            <td className={`${adminTable.tdFirst} ${adminTable.amountPrimary}`}>
                              {money(repayment.amount, currency)}
                            </td>
                            <td className={adminTable.tdMuted}>
                              {formatDate(repayment.payment_date)}
                            </td>
                            <td className={adminTable.td}>
                              <SavingStatusBadge
                                status={repayment.status as SavingStatus}
                                plain
                              />
                            </td>
                            <td className={adminTable.tdLast}>
                              {formatDate(repayment.created_at)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </DetailSection>
            </div>

            <aside className="space-y-6">
              <DetailSection title="សមាជិក">
                <Link
                  href={`/admin/members/${loan.member_id}`}
                  className="group flex items-start gap-3 rounded-xl border border-border bg-surface-muted/40 p-4 transition hover:border-brand-200 hover:bg-brand-50/40"
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-100 text-brand-700">
                    <User className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="font-medium text-foreground transition group-hover:text-brand-700">
                      {memberName}
                    </p>
                    {member?.email && (
                      <p className="mt-1 flex items-center gap-1.5 truncate text-xs text-muted">
                        <Mail className="h-3.5 w-3.5 shrink-0" />
                        {member.email}
                      </p>
                    )}
                    {member?.phone && (
                      <p className="mt-1 flex items-center gap-1.5 text-xs text-muted">
                        <Phone className="h-3.5 w-3.5 shrink-0" />
                        {member.phone}
                      </p>
                    )}
                  </div>
                </Link>
              </DetailSection>

              <DetailSection title="លក្ខខណ្ឌ">
                <dl className="space-y-3">
                  <InfoRow icon={Calendar} label="រូបិយប័ណ្ណ" value={currency} />
                  <InfoRow icon={Percent} label="អត្រាការប្រាក់" value={`${loanRate}% / ខែ`} />
                  <InfoRow
                    icon={Calendar}
                    label="កាលបរិច្ឆេទបង់"
                    value={formatDate(loan.due_date)}
                  />
                  {approver?.full_name && (
                    <InfoRow icon={User} label="ទទួលដោយ" value={approver.full_name} />
                  )}
                </dl>
              </DetailSection>

              <DetailSection title="ឯកសារ និងការផ្ទៀងផ្ទាត់">
                <div className="mb-4">
                  <div className="mb-2 flex items-center justify-between text-xs">
                    <span className="font-medium text-muted">វឌ្ឍនភាព</span>
                    <span className="font-semibold tabular-nums text-foreground">{docsPercent}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-surface-muted">
                    <div
                      className={`h-full rounded-full transition-all ${
                        docsComplete ? 'bg-emerald-500' : 'bg-amber-400'
                      }`}
                      style={{ width: `${docsPercent}%` }}
                    />
                  </div>
                </div>
                <ul className="space-y-3">
                  {docChecklist.map((item) => (
                    <li
                      key={item.label}
                      className="flex items-start justify-between gap-3 rounded-xl border border-border bg-surface-muted/30 px-3 py-3"
                    >
                      <div className="flex min-w-0 items-start gap-2.5">
                        {item.done ? (
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                        ) : (
                          <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-muted" />
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground">{item.label}</p>
                          <p className="text-xs text-muted">{item.detail}</p>
                        </div>
                      </div>
                      {item.href ? (
                        <AdminExternalLink href={item.href}>មើល</AdminExternalLink>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </DetailSection>

              {hasRefereeInfo && (
                <DetailSection title="អ្នកធានា">
                  <div className="rounded-xl border border-border bg-surface-muted/30 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium text-foreground">
                          {referee?.full_name ?? refereeName}
                        </p>
                        <p className="mt-1 text-xs text-muted">
                          {referee?.phone ?? refereePhone ?? 'គ្មានទូរស័ព្ទ'}
                        </p>
                        {(referee?.email || refereeEmail) && (
                          <p className="mt-1 text-xs text-muted">
                            {referee?.email ?? refereeEmail}
                          </p>
                        )}
                      </div>
                      <span
                        className={`shrink-0 text-xs font-semibold ${
                          loan.referee_verified ? 'text-emerald-600' : 'text-amber-600'
                        }`}
                      >
                        {loan.referee_verified ? 'បានបញ្ជាក់' : 'រង់ចាំ'}
                      </span>
                    </div>
                    {referee && (
                      <Link
                        href={`/admin/members/${referee.id}`}
                        className="mt-3 inline-block text-xs font-medium text-brand-700 hover:text-brand-900"
                      >
                        មើលប្រវត្តិសមាជិក
                      </Link>
                    )}
                  </div>
                </DetailSection>
              )}
            </aside>
          </div>
        </div>
      </AdminPanel>
    </main>
  )
}

function DetailSection({
  title,
  children,
  noPadding = false,
}: {
  title: string
  children: React.ReactNode
  noPadding?: boolean
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-surface ring-1 ring-foreground/5">
      <div className="border-b border-border px-5 py-4 md:px-6">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      </div>
      {noPadding ? children : <div className="px-5 py-4 md:px-6 md:py-5">{children}</div>}
    </section>
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
    <div className="rounded-xl border border-border bg-surface-muted/40 p-4 ring-1 ring-foreground/5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
          <p className={`mt-1.5 truncate text-xl font-bold tabular-nums ${accentClass}`}>{value}</p>
          <p className="mt-1 line-clamp-2 text-xs text-muted">{hint}</p>
        </div>
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-700">
          <Icon className="h-4 w-4" />
        </span>
      </div>
    </div>
  )
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg bg-surface-muted/40 px-3 py-2.5">
      <dt className="flex items-center gap-2 text-xs text-muted">
        <Icon className="h-3.5 w-3.5 shrink-0" />
        {label}
      </dt>
      <dd className="text-sm font-medium text-foreground">{value}</dd>
    </div>
  )
}

function buildTimeline(loan: AdminLoanDetailRecord) {
  const status = loan.status as LoanStatus
  const steps = [
    {
      label: 'ដាក់ស្នើ',
      date: loan.created_at,
      placeholder: '—',
      done: Boolean(loan.created_at),
      current: status === 'pending' || status === 'under_review',
    },
    {
      label: 'ទទួលយក',
      date: loan.approved_at,
      placeholder: 'រង់ចាំ',
      done: Boolean(loan.approved_at),
      current: status === 'approved',
    },
    {
      label: 'ដំណើរការ',
      date: loan.disbursed_at,
      placeholder: 'រង់ចាំ',
      done: Boolean(loan.disbursed_at),
      current: status === 'active',
    },
    {
      label: 'កំណត់បង់',
      date: loan.due_date,
      placeholder: '—',
      done: status === 'completed',
      current: status === 'active' && Boolean(loan.disbursed_at),
    },
  ]

  if (status === 'rejected') {
    return steps.map((step, index) =>
      index === 0 ? step : { ...step, done: false, current: false, placeholder: '—' }
    )
  }

  return steps
}
