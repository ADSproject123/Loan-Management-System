'use client'

import { useMemo, useState } from 'react'
import { money } from '@/app/admin/adminUtils'
import { SavingInterestDueList } from '@/app/admin/savings/SavingInterestDueList'
import { AdminListToolbar, adminFieldClassName } from '@/components/admin'
import { Select } from '@/components/ui/Select'
import {
  buildSavingInterestDueRowsForMonth,
  type SavingInterestPaymentRow,
  type VerifiedSavingInterestRow,
} from '@/lib/admin/savingInterestDue'
import { KHMER_MONTHS } from '@/lib/dates'
import type { CurrencyCode } from '@/lib/currency'

const SEARCH_PLACEHOLDER = 'ស្វែងរកតាមឈ្មោះ ឬចំនួនទឹកប្រាក់...'

type SavingInterestDueViewProps = {
  savings: VerifiedSavingInterestRow[]
  interestPayments: SavingInterestPaymentRow[]
  monthlySavingInterestRate: number
  asOfDate: string
  currentYear: number
  currentMonth: number
}

function filterRows(
  rows: ReturnType<typeof buildSavingInterestDueRowsForMonth>,
  query: string
) {
  const q = query.trim().toLowerCase()
  if (!q) return rows
  return rows.filter((row) => {
    const balance = money(row.savingsBalance, (row.currency as CurrencyCode) ?? 'USD').toLowerCase()
    const interest = money(row.interestDue, (row.currency as CurrencyCode) ?? 'USD').toLowerCase()
    return (
      row.memberSearchText.includes(q) ||
      (row.memberPhone ?? '').includes(q) ||
      balance.includes(q) ||
      interest.includes(q)
    )
  })
}

export function SavingInterestDueView({
  savings,
  interestPayments,
  monthlySavingInterestRate,
  asOfDate,
  currentYear,
  currentMonth,
}: SavingInterestDueViewProps) {
  const [query, setQuery] = useState('')
  const [selectedMonth, setSelectedMonth] = useState(currentMonth)

  const dueRows = useMemo(
    () =>
      buildSavingInterestDueRowsForMonth(
        savings,
        monthlySavingInterestRate,
        currentYear,
        selectedMonth,
        asOfDate,
        interestPayments
      ),
    [
      savings,
      interestPayments,
      monthlySavingInterestRate,
      currentYear,
      selectedMonth,
      asOfDate,
    ]
  )

  const filteredRows = useMemo(() => filterRows(dueRows, query), [dueRows, query])
  const selectedMonthLabel = KHMER_MONTHS[selectedMonth - 1] ?? String(selectedMonth)

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <AdminListToolbar
        searchValue={query}
        onSearchChange={setQuery}
        searchPlaceholder={SEARCH_PLACEHOLDER}
        extra={
          <Select
            id="saving-interest-month-filter"
            value={String(selectedMonth)}
            onChange={(v) => setSelectedMonth(Number(v))}
            options={KHMER_MONTHS.map((label, index) => ({
              value: String(index + 1),
              label,
            }))}
            aria-label="ជ្រើសរើសខែ"
            className="min-w-36 shrink-0"
            triggerClassName={`${adminFieldClassName} flex cursor-pointer items-center justify-between gap-2 py-2.5 pl-3 pr-3 text-xs font-semibold`}
          />
        }
        filterSummary={
          <>
            បង្ហាញ <span className="font-semibold text-foreground">{filteredRows.length}</span> នៃ{' '}
            <span className="font-semibold text-foreground">{dueRows.length}</span>
            <span className="text-muted">
              {' '}
              · {selectedMonthLabel} {currentYear}
            </span>
          </>
        }
      />

      <SavingInterestDueList
        rows={filteredRows}
        totalCount={dueRows.length}
        month={selectedMonth}
        year={currentYear}
      />
    </div>
  )
}
