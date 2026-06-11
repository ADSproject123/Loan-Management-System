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

const STATUS_FILTER_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'ទាំងអស់' },
  { value: 'pending', label: 'រង់ចាំ' },
  { value: 'under_review', label: 'កំពុងពិនិត្យ' },
  { value: 'approved', label: 'បានទទួលយក' },
  { value: 'active', label: 'សកម្ម' },
  { value: 'completed', label: 'បានទទួល' },
  { value: 'rejected', label: 'បានបដិសេធ' },
]

const EMPTY_COPY: Record<
  LoansListVariant,
  { title: string; description: string }
> = {
  all: {
    title: 'មិនមានពាក្យសុំកម្ជី',
    description: 'ពាក្យសុំកម្ជីថ្មីរបស់សមាជិកនឹងបង្ហាញនៅទីនេះ។',
  },
  active: {
    title: 'មិនមានកម្ជីសកម្ម',
    description: 'កម្ជីដែលបានដំណើរការនឹងបង្ហាញនៅទីនេះ។',
  },
  requests: {
    title: 'មិនមានពាក្យសុំរង់ចាំ',
    description: 'ពាក្យសុំកម្ជីថ្មីនឹងបង្ហាញនៅទីនេះ។',
  },
}

export function LoansList({
  loans,
  showActions = true,
  variant = 'all',
}: {
  loans: LoanListItem[]
  showActions?: boolean
  variant?: LoansListVariant
}) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const isActiveView = variant === 'active'
  const showStatusColumn = !isActiveView
  const showStatusFilter = variant === 'all'
  const colSpan =
    (showStatusColumn ? 1 : 0) + (isActiveView ? 1 : 0) + 3 + (showActions ? 1 : 0)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()

    return loans.filter((loan) => {
      if (showStatusFilter && statusFilter && loan.status !== statusFilter) return false
      if (!q) return true

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
  }, [loans, query, showStatusFilter, statusFilter])

  const openLoan = (loanId: string) => router.push(`/admin/loans/${loanId}`)

  return (
    <>
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
          <>
            បង្ហាញ <span className="font-semibold text-foreground">{filtered.length}</span> នៃ{' '}
            <span className="font-semibold text-foreground">{loans.length}</span>
          </>
        }
      />

      <div className={adminTable.wrap}>
        <table className={adminTable.table}>
          <thead className={adminTable.thead}>
            <tr className={adminTable.thRow}>
              <th className={adminTable.thFirst}>សមាជិក</th>
              <th className={adminTable.th}>ចំនួនទឹកប្រាក់</th>
              {showStatusColumn ? <th className={adminTable.th}>ស្ថានភាព</th> : null}
              {isActiveView ? (
                <>
                  <th className={adminTable.th}>ចាប់ផ្តើម</th>
                  <th className={adminTable.th}>កំណត់បង់</th>
                </>
              ) : (
                <th className={adminTable.th}>ដាក់ស្នើ</th>
              )}
              {showActions ? <th className={adminTable.thLast}>សកម្មភាព</th> : null}
            </tr>
          </thead>
          <tbody className={adminTable.tbody}>
            {loans.length === 0 && (
              <AdminTableEmpty
                colSpan={colSpan}
                icon={Landmark}
                title={EMPTY_COPY[variant].title}
                description={EMPTY_COPY[variant].description}
              />
            )}

            {loans.length > 0 && filtered.length === 0 && (
              <AdminTableNoResults colSpan={colSpan} />
            )}

            {filtered.map((loan) => {
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
                  <td className={adminTable.tdFirst}>
                    <div className={adminTable.memberCell}>
                      <MemberAvatar name={memberName} />
                      <div className="min-w-0">
                        <p className={adminTable.namePrimary}>{memberName}</p>
                        <p className={adminTable.nameSecondary}>{relatedMemberEmail(loan)}</p>
                      </div>
                    </div>
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
        </table>
      </div>
    </>
  )
}

function MemberAvatar({ name }: { name: string }) {
  const initial = name.trim().charAt(0).toUpperCase() || '?'

  return (
    <span className={adminTable.memberAvatar} aria-hidden>
      {initial}
    </span>
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
