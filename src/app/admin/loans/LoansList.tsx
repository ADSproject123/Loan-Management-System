'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronRight, Landmark } from 'lucide-react'
import { LoanStatusBadge } from '@/components/ui/Badge'
import { formatDate, money, relatedMemberEmail, relatedMemberName } from '@/app/admin/adminUtils'
import type { CurrencyCode } from '@/lib/currency'
import type { LoanStatus } from '@/types/database'
import {
  AdminListToolbar,
  AdminTableEmpty,
  AdminTableNoResults,
  adminTable,
  adminTableRowClass,
} from '@/components/admin'
import { LoanActions } from '@/app/admin/loans/LoanActions'

export type LoanListItem = {
  id: string
  member_id: string
  amount: number | null
  currency: string | null
  purpose: string | null
  status: string
  created_at: string
  due_date?: string | null
  disbursed_at?: string | null
  term_months?: number | null
  members?: { full_name?: string | null; email?: string | null } | { full_name?: string | null; email?: string | null }[] | null
}

type LoansListVariant = 'all' | 'active' | 'requests'

type MemberLoanGroup = {
  member_id: string
  primaryLoanId: string
  members: LoanListItem['members']
  totalAmount: number
  currency: string | null
  loanCount: number
  latestCreatedAt: string
  latestDisbursedAt: string | null
  nearestDueDate: string | null
  hasPending: boolean
}

function isActiveLoanStatus(status: string) {
  return status === 'active' || status === 'approved'
}

function isPendingLoanStatus(status: string) {
  return status === 'pending' || status === 'under_review'
}

function pickNearestDueDate(existing: string | null, candidate: string | null) {
  if (!candidate) return existing
  if (!existing) return candidate
  return new Date(candidate).getTime() < new Date(existing).getTime() ? candidate : existing
}

function aggregateLoansByMember(
  loans: LoanListItem[],
  allLoans: LoanListItem[],
  statusFilter: string,
  activeOnly = false
): MemberLoanGroup[] {
  const source = activeOnly
    ? loans
    : statusFilter === ''
      ? loans.filter((loan) => isActiveLoanStatus(loan.status))
      : loans

  const groups = new Map<string, MemberLoanGroup>()

  for (const loan of source) {
    const amount = Number(loan.amount ?? 0)
    const disbursedAt = loan.disbursed_at ?? loan.created_at
    const existing = groups.get(loan.member_id)

    if (!existing) {
      groups.set(loan.member_id, {
        member_id: loan.member_id,
        primaryLoanId: loan.id,
        members: loan.members,
        totalAmount: amount,
        currency: loan.currency,
        loanCount: 1,
        latestCreatedAt: loan.created_at,
        latestDisbursedAt: disbursedAt,
        nearestDueDate: loan.due_date ?? null,
        hasPending: allLoans.some(
          (row) => row.member_id === loan.member_id && isPendingLoanStatus(row.status)
        ),
      })
      continue
    }

    existing.totalAmount += amount
    existing.loanCount += 1

    if (new Date(loan.created_at).getTime() > new Date(existing.latestCreatedAt).getTime()) {
      existing.latestCreatedAt = loan.created_at
    }

    if (
      disbursedAt &&
      (!existing.latestDisbursedAt ||
        new Date(disbursedAt).getTime() > new Date(existing.latestDisbursedAt).getTime())
    ) {
      existing.latestDisbursedAt = disbursedAt
      existing.primaryLoanId = loan.id
    }

    existing.nearestDueDate = pickNearestDueDate(existing.nearestDueDate, loan.due_date ?? null)
  }

  return Array.from(groups.values()).sort(
    (a, b) => new Date(b.latestCreatedAt).getTime() - new Date(a.latestCreatedAt).getTime()
  )
}

const STATUS_FILTER_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'ទាំងអស់' },
  { value: 'pending', label: 'រង់ចាំ' },
  { value: 'under_review', label: 'កំពុងពិនិត្យ' },
  { value: 'approved', label: 'បានទទួលយក' },
  { value: 'active', label: 'សកម្ម' },
  { value: 'completed', label: 'បានទទួល' },
  { value: 'rejected', label: 'បានបដិសេធ' },
]

const EMPTY_COPY: Record<LoansListVariant, { title: string }> = {
  all: {
    title: 'មិនមានពាក្យសុំកម្ជី',
  },
  active: {
    title: 'មិនមានកម្ជីសកម្ម',
  },
  requests: {
    title: 'មិនមានពាក្យសុំរង់ចាំ',
  },
}

export function LoansList({
  loans,
  showActions = true,
  variant = 'all',
  mode = 'transactions',
}: {
  loans: LoanListItem[]
  showActions?: boolean
  variant?: LoansListVariant
  mode?: 'ledger' | 'transactions'
}) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const isActiveView = variant === 'active'
  const isLedgerView = mode === 'ledger'
  const showStatusColumn = !isActiveView
  const showStatusFilter = variant === 'all'
  const colSpan =
    (showStatusColumn ? 1 : 0) + (isActiveView ? 1 : 0) + 3 + (showActions ? 1 : 0)
  const ledgerColSpan = 6

  const filteredByStatus = useMemo(() => {
    return loans.filter((loan) => {
      if (showStatusFilter && statusFilter && loan.status !== statusFilter) return false
      return true
    })
  }, [loans, showStatusFilter, statusFilter])

  const filtered = useMemo(() => {
    if (isLedgerView) return filteredByStatus

    const q = query.trim().toLowerCase()
    if (!q) return filteredByStatus

    return filteredByStatus.filter((loan) => {
      const name = relatedMemberName(loan).toLowerCase()
      const email = relatedMemberEmail(loan).toLowerCase()
      const purpose = (loan.purpose ?? '').toLowerCase()
      const amount = money(loan.amount, (loan.currency as CurrencyCode) ?? 'USD').toLowerCase()

      return (
        name.includes(q) ||
        email.includes(q) ||
        purpose.includes(q) ||
        amount.includes(q)
      )
    })
  }, [filteredByStatus, isLedgerView, query])

  const memberGroups = useMemo(() => {
    if (!isLedgerView) return []
    return aggregateLoansByMember(filtered, loans, statusFilter, isActiveView)
  }, [filtered, isLedgerView, isActiveView, loans, statusFilter])

  const ledgerFiltered = useMemo(() => {
    if (!isLedgerView) return []
    const q = query.trim().toLowerCase()
    if (!q) return memberGroups

    return memberGroups.filter((group) => {
      const name = relatedMemberName(group).toLowerCase()
      const email = relatedMemberEmail(group).toLowerCase()
      const amount = money(group.totalAmount, (group.currency as CurrencyCode) ?? 'USD').toLowerCase()
      return name.includes(q) || email.includes(q) || amount.includes(q)
    })
  }, [isLedgerView, memberGroups, query])

  const totalLedgerMembers = useMemo(() => {
    if (!isLedgerView) return 0
    return aggregateLoansByMember(loans, loans, statusFilter, isActiveView).length
  }, [isLedgerView, isActiveView, loans, statusFilter])

  const ledgerTotals = useMemo(() => {
    if (!isLedgerView || !isActiveView) return null

    let totalAmount = 0
    let totalLoans = 0
    for (const group of ledgerFiltered) {
      totalAmount += group.totalAmount
      totalLoans += group.loanCount
    }

    return {
      totalAmount,
      totalLoans,
      memberCount: ledgerFiltered.length,
      currency: (ledgerFiltered[0]?.currency as CurrencyCode) ?? 'USD',
    }
  }, [isLedgerView, isActiveView, ledgerFiltered])

  const displayRows = isLedgerView ? ledgerFiltered : filtered

  const openMember = (memberId: string) => router.push(`/admin/members/${memberId}`)

  const openLoan = (loanId: string) => router.push(`/admin/loans/${loanId}`)

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <AdminListToolbar
        searchValue={query}
        onSearchChange={setQuery}
        searchPlaceholder={
          isActiveView
            ? 'ស្វែងរកតាមឈ្មោះ អ៊ីមែល ឬចំនួនទឹកប្រាក់...'
            : 'ស្វែងរកតាមឈ្មោះ អ៊ីមែល គោលបំណង ឬចំនួនទឹកប្រាក់...'
        }
        selectLabel={showStatusFilter ? 'ស្ថានភាព' : undefined}
        selectId="loan-status-filter"
        selectValue={statusFilter}
        onSelectChange={setStatusFilter}
        selectOptions={showStatusFilter ? STATUS_FILTER_OPTIONS : undefined}
        filterSummary={
          isLedgerView ? (
            <>
              បង្ហាញ <span className="font-semibold text-foreground">{displayRows.length}</span> នៃ{' '}
              <span className="font-semibold text-foreground">{totalLedgerMembers}</span> សមាជិក
            </>
          ) : (
            <>
              បង្ហាញ <span className="font-semibold text-foreground">{filtered.length}</span> នៃ{' '}
              <span className="font-semibold text-foreground">{loans.length}</span>
            </>
          )
        }
      />

      <div className={adminTable.wrap}>
        <table className={adminTable.table}>
          <thead className={adminTable.thead}>
            <tr className={adminTable.thRow}>
              <th className={adminTable.thFirst}>សមាជិក</th>
              <th className={adminTable.th}>
                {isLedgerView ? 'កម្ជីសរុប' : 'ចំនួនទឹកប្រាក់'}
              </th>
              {isLedgerView ? <th className={adminTable.th}>ចំនួនកម្ជី</th> : null}
              {!isLedgerView && showStatusColumn ? <th className={adminTable.th}>ស្ថានភាព</th> : null}
              {isActiveView || isLedgerView ? (
                <>
                  <th className={adminTable.th}>ចាប់ផ្តើម</th>
                  <th className={adminTable.th}>កំណត់បង់</th>
                </>
              ) : (
                <th className={adminTable.th}>ដាក់ស្នើ</th>
              )}
              {showActions && !isLedgerView ? <th className={adminTable.thLast}>សកម្មភាព</th> : null}
            </tr>
          </thead>
          <tbody className={adminTable.tbody}>
            {loans.length === 0 && (
              <AdminTableEmpty
                colSpan={isLedgerView ? ledgerColSpan : colSpan}
                icon={Landmark}
                title={EMPTY_COPY[variant].title}
              />
            )}

            {loans.length > 0 && displayRows.length === 0 && (
              <AdminTableNoResults colSpan={isLedgerView ? ledgerColSpan : colSpan} />
            )}

            {isLedgerView &&
              ledgerFiltered.map((group) => {
                const memberName = relatedMemberName(group)
                const dueMeta = getDueDateMeta(group.nearestDueDate)
                const openLedgerRow = isActiveView
                  ? () => openLoan(group.primaryLoanId)
                  : () => openMember(group.member_id)

                return (
                  <tr
                    key={group.member_id}
                    tabIndex={0}
                    role="link"
                    aria-label={
                      isActiveView ? `មើលកម្ជី ${memberName}` : `មើលសមាជិក ${memberName}`
                    }
                    className={adminTableRowClass({
                      pending: group.hasPending,
                      clickable: true,
                      overdue: dueMeta.tone === 'error',
                    })}
                    onClick={openLedgerRow}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        openLedgerRow()
                      }
                    }}
                  >
                    <td className={`${adminTable.tdFirst} ${adminTable.namePrimary}`}>
                      {memberName}
                    </td>
                    <td className={adminTable.td}>
                      <p className={adminTable.amountPrimary}>
                        {money(group.totalAmount, (group.currency as CurrencyCode) ?? 'USD')}
                      </p>
                    </td>
                    <td className={adminTable.tdMuted}>{group.loanCount} កម្ជី</td>
                    <td className={adminTable.tdMuted}>
                      {formatDate(group.latestDisbursedAt ?? group.latestCreatedAt)}
                    </td>
                    <td className={adminTable.td}>
                      <DueDateCell meta={dueMeta} />
                    </td>
                  </tr>
                )
              })}

            {!isLedgerView &&
              filtered.map((loan) => {
              const memberName = relatedMemberName(loan)
              const dueMeta = isActiveView ? getDueDateMeta(loan.due_date) : null
              const isPending =
                loan.status === 'pending' || loan.status === 'under_review'

              return (
                <tr
                  key={loan.id}
                  tabIndex={0}
                  role="link"
                  aria-label={`មើលកម្ជី ${memberName}`}
                  className={adminTableRowClass({
                    pending: isPending,
                    clickable: true,
                    overdue: dueMeta?.tone === 'error',
                  })}
                  onClick={() => openLoan(loan.id)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      openLoan(loan.id)
                    }
                  }}
                >
                  <td className={`${adminTable.tdFirst} ${adminTable.namePrimary}`}>
                    {memberName}
                  </td>
                  <td className={adminTable.td}>
                    <p className={adminTable.amountPrimary}>
                      {money(loan.amount, (loan.currency as CurrencyCode) ?? 'USD')}
                    </p>
                    <p className={`${adminTable.amountSecondary} line-clamp-1`}>
                      {loan.purpose || (loan.term_months ? `${loan.term_months} ខែ` : '—')}
                    </p>
                  </td>
                  {showStatusColumn ? (
                    <td className={adminTable.td}>
                      <LoanStatusBadge status={loan.status as LoanStatus} plain />
                    </td>
                  ) : null}
                  {isActiveView ? (
                    <>
                      <td className={adminTable.tdMuted}>
                        {formatDate(loan.disbursed_at ?? loan.created_at)}
                      </td>
                      <td className={adminTable.td}>
                        <DueDateCell meta={dueMeta} />
                      </td>
                    </>
                  ) : (
                    <td className={adminTable.tdMuted}>{formatDate(loan.created_at)}</td>
                  )}
                  {showActions ? (
                    <td className={adminTable.tdLast} onClick={(event) => event.stopPropagation()}>
                      <div className="flex items-center justify-end gap-2">
                        <LoanActions loanId={loan.id} status={loan.status as LoanStatus} />
                        <ChevronRight className={`${adminTable.rowChevron} hidden sm:block`} />
                      </div>
                    </td>
                  ) : null}
                </tr>
              )
            })}
          </tbody>
          {isLedgerView && isActiveView && ledgerTotals && ledgerFiltered.length > 0 && (
            <tfoot className="border-t-2 border-border bg-surface-muted/60">
              <tr>
                <td className={`${adminTable.tdFirst} font-semibold text-foreground`}>
                  សរុប ({ledgerTotals.memberCount} សមាជិក)
                </td>
                <td className={adminTable.td}>
                  <p className={`${adminTable.amountPrimary} font-bold`}>
                    {money(ledgerTotals.totalAmount, ledgerTotals.currency)}
                  </p>
                </td>
                <td className={`${adminTable.tdMuted} font-semibold`}>
                  {ledgerTotals.totalLoans} កម្ជី
                </td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  )
}

type DueDateMeta = {
  label: string
  sub: string
  tone: 'muted' | 'warning' | 'error'
}

function getDueDateMeta(dueDate?: string | null): DueDateMeta {
  if (!dueDate) {
    return { label: '—', sub: 'មិនបានកំណត់', tone: 'muted' }
  }

  const due = new Date(dueDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  due.setHours(0, 0, 0, 0)

  if (Number.isNaN(due.getTime())) {
    return { label: formatDate(dueDate), sub: '', tone: 'muted' }
  }

  const diffDays = Math.round((due.getTime() - today.getTime()) / 86_400_000)

  if (diffDays < 0) {
    return {
      label: formatDate(dueDate),
      sub: `ហួស ${Math.abs(diffDays)} ថ្ងៃ`,
      tone: 'error',
    }
  }

  if (diffDays === 0) {
    return { label: formatDate(dueDate), sub: 'ត្រូវបង់ថ្ងៃនេះ', tone: 'warning' }
  }

  if (diffDays <= 7) {
    return { label: formatDate(dueDate), sub: `នៅសល់ ${diffDays} ថ្ងៃ`, tone: 'warning' }
  }

  return { label: formatDate(dueDate), sub: `នៅសល់ ${diffDays} ថ្ងៃ`, tone: 'muted' }
}

function DueDateCell({ meta }: { meta: DueDateMeta | null }) {
  if (!meta) return null

  const toneClass =
    meta.tone === 'error'
      ? 'text-red-600'
      : meta.tone === 'warning'
        ? 'text-amber-600'
        : 'text-muted'

  return (
    <div>
      <p className="text-sm font-medium text-foreground">{meta.label}</p>
      {meta.sub ? <p className={`text-xs font-medium ${toneClass}`}>{meta.sub}</p> : null}
    </div>
  )
}
