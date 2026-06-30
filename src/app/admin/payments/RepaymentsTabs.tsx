'use client'

import { useEffect, useMemo, useState } from 'react'
import { CalendarClock, Clock } from 'lucide-react'
import { money, relatedMemberEmail, relatedMemberMatchesSearch } from '@/app/admin/adminUtils'
import { DueThisMonthList } from '@/app/admin/payments/DueThisMonthList'
import { RepaymentsList, type RepaymentListItem } from '@/app/admin/payments/RepaymentsList'
import { AdminListToolbar, AdminSegmentedTabs, adminFieldClassName } from '@/components/admin'
import { Select } from '@/components/ui/Select'
import {
  buildLoanDueRowsForMonth,
  type ActiveLoanDueRow,
  type LoanDuePaymentRow,
  type LoanRepaymentAmountRow,
} from '@/lib/admin/loanRepaymentDue'
import { KHMER_MONTHS } from '@/lib/dates'
import type { CurrencyCode } from '@/lib/currency'

export type RepaymentsTabId = 'due' | 'pending'

type RepaymentsTabsProps = {
  activeLoans: ActiveLoanDueRow[]
  loanRepayments: LoanRepaymentAmountRow[]
  loanDuePayments: LoanDuePaymentRow[]
  monthlyLoanInterestRate: number
  asOfDate: string
  currentYear: number
  currentMonth: number
  pendingRepayments: RepaymentListItem[]
  defaultTab?: RepaymentsTabId
}

const SEARCH_PLACEHOLDER = 'ស្វែងរកតាមឈ្មោះ ឬចំនួនទឹកប្រាក់...'

const TABS = [
  { id: 'due' as const, label: 'ត្រូវបង់ខែនេះ', icon: CalendarClock },
  { id: 'pending' as const, label: 'រង់ចាំទទួល', icon: Clock },
]

function filterDueRows(
  rows: ReturnType<typeof buildLoanDueRowsForMonth>,
  query: string
) {
  const q = query.trim().toLowerCase()
  if (!q) return rows
  return rows.filter((row) => {
    const amount = money(row.dueAmount, (row.currency as CurrencyCode) ?? 'USD').toLowerCase()
    return (
      row.memberSearchText.includes(q) ||
      (row.memberPhone ?? '').includes(q) ||
      amount.includes(q)
    )
  })
}

function filterPendingRows(rows: RepaymentListItem[], query: string) {
  const q = query.trim().toLowerCase()
  if (!q) return rows
  return rows.filter((row) => {
    const email = relatedMemberEmail(row).toLowerCase()
    const amount = money(row.amount, (row.currency as CurrencyCode) ?? 'USD').toLowerCase()
    return relatedMemberMatchesSearch(row, q) || email.includes(q) || amount.includes(q)
  })
}

export function RepaymentsTabs({
  activeLoans,
  loanRepayments,
  loanDuePayments,
  monthlyLoanInterestRate,
  asOfDate,
  currentYear,
  currentMonth,
  pendingRepayments,
  defaultTab = 'due',
}: RepaymentsTabsProps) {
  const [activeTab, setActiveTab] = useState<RepaymentsTabId>(defaultTab)
  const [query, setQuery] = useState('')
  const [selectedMonth, setSelectedMonth] = useState(currentMonth)

  useEffect(() => {
    setActiveTab(defaultTab)
  }, [defaultTab])

  const dueRows = useMemo(
    () =>
      buildLoanDueRowsForMonth(
        activeLoans,
        loanRepayments,
        monthlyLoanInterestRate,
        currentYear,
        selectedMonth,
        asOfDate,
        loanDuePayments
      ),
    [
      activeLoans,
      loanRepayments,
      loanDuePayments,
      monthlyLoanInterestRate,
      currentYear,
      selectedMonth,
      asOfDate,
    ]
  )

  const activeRows = activeTab === 'due' ? dueRows : pendingRepayments
  const filteredDue = useMemo(() => filterDueRows(dueRows, query), [dueRows, query])
  const filteredPending = useMemo(
    () => filterPendingRows(pendingRepayments, query),
    [pendingRepayments, query]
  )
  const filteredCount = activeTab === 'due' ? filteredDue.length : filteredPending.length
  const selectedMonthLabel = KHMER_MONTHS[selectedMonth - 1] ?? String(selectedMonth)

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <AdminListToolbar
        searchValue={query}
        onSearchChange={setQuery}
        searchPlaceholder={SEARCH_PLACEHOLDER}
        extra={
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <AdminSegmentedTabs
              tabs={TABS}
              activeTab={activeTab}
              onChange={setActiveTab}
              ariaLabel="ផ្ទាំងការសងកម្ជី"
            />

            {activeTab === 'due' && (
              <Select
                id="due-month-filter"
                value={String(selectedMonth)}
                onChange={(v) => setSelectedMonth(Number(v))}
                options={KHMER_MONTHS.map((label, index) => ({
                  value: String(index + 1),
                  label,
                }))}
                aria-label="ជ្រើសរើសខែ"
                className="min-w-36"
                triggerClassName={`${adminFieldClassName} flex cursor-pointer items-center justify-between gap-2 py-2.5 pl-3 pr-3 text-xs font-semibold`}
              />
            )}
          </div>
        }
        filterSummary={
          <>
            បង្ហាញ <span className="font-semibold text-foreground">{filteredCount}</span> នៃ{' '}
            <span className="font-semibold text-foreground">{activeRows.length}</span>
            {activeTab === 'due' ? (
              <span className="text-muted">
                {' '}
                · {selectedMonthLabel} {currentYear}
              </span>
            ) : null}
          </>
        }
      />

      {activeTab === 'due' ? (
        <DueThisMonthList
          rows={filteredDue}
          totalCount={dueRows.length}
          month={selectedMonth}
          year={currentYear}
        />
      ) : (
        <RepaymentsList
          repayments={filteredPending}
          totalCount={pendingRepayments.length}
          variant="pending"
          embed
        />
      )}
    </div>
  )
}
