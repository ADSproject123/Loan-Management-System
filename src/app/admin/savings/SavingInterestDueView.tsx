'use client'

import { useMemo, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { money } from '@/app/admin/adminUtils'
import { SavingInterestDueList } from '@/app/admin/savings/SavingInterestDueList'
import { AdminListToolbar, adminFieldClassName } from '@/components/admin'
import {
  buildSavingInterestDueRowsForMonth,
  type SavingInterestPaymentRow,
  type VerifiedSavingInterestRow,
} from '@/lib/admin/savingInterestDue'
import { KHMER_MONTHS } from '@/lib/dates'
import type { CurrencyCode } from '@/lib/currency'

const MONTH_SELECT_CLASS = `${adminFieldClassName} appearance-none py-2.5 pl-3 pr-9 text-xs font-semibold`

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
      row.memberName.toLowerCase().includes(q) ||
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
          <div className="relative shrink-0">
            <select
              className={MONTH_SELECT_CLASS}
              value={selectedMonth}
              onChange={(event) => setSelectedMonth(Number(event.target.value))}
              aria-label="ជ្រើសរើសខែ"
            >
              {KHMER_MONTHS.map((label, index) => (
                <option key={label} value={index + 1}>
                  {label}
                </option>
              ))}
            </select>
            <ChevronDown
              className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
              aria-hidden
            />
          </div>
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
