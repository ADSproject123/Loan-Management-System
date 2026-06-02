'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { PiggyBank } from 'lucide-react'
import { SavingStatusBadge } from '@/components/ui/Badge'
import { SavingActions } from '@/app/admin/savings/SavingActions'
import { formatDate, money, relatedMemberEmail, relatedMemberName } from '@/app/admin/adminUtils'
import type { CurrencyCode } from '@/lib/currency'
import type { SavingStatus } from '@/types/database'
import {
  AdminDateField,
  AdminExternalLink,
  AdminListToolbar,
  AdminTableEmpty,
  AdminTableNoResults,
} from '@/components/admin'

export type SavingListItem = {
  id: string
  member_id: string
  amount: number | null
  currency: string | null
  status: string
  evidence_url: string | null
  saving_date: string | null
  created_at: string
  evidenceSignedUrl: string | null
  members?: { full_name?: string | null; email?: string | null } | { full_name?: string | null; email?: string | null }[] | null
}

export function SavingsList({ savings }: { savings: SavingListItem[] }) {
  const [query, setQuery] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const hasActiveFilters = Boolean(query.trim() || dateFrom || dateTo)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const fromMs = dateFrom ? startOfDay(dateFrom) : null
    const toMs = dateTo ? endOfDay(dateTo) : null

    return savings.filter((saving) => {
      if (q) {
        const name = relatedMemberName(saving).toLowerCase()
        const email = relatedMemberEmail(saving).toLowerCase()
        const amount = money(saving.amount, (saving.currency as CurrencyCode) ?? 'USD').toLowerCase()
        const currency = (saving.currency ?? '').toLowerCase()
        const matchesQuery =
          name.includes(q) || email.includes(q) || amount.includes(q) || currency.includes(q)
        if (!matchesQuery) return false
      }

      if (fromMs !== null || toMs !== null) {
        const recordMs = recordDateMs(saving)
        if (recordMs === null) return false
        if (fromMs !== null && recordMs < fromMs) return false
        if (toMs !== null && recordMs > toMs) return false
      }

      return true
    })
  }, [savings, query, dateFrom, dateTo])

  function clearFilters() {
    setQuery('')
    setDateFrom('')
    setDateTo('')
  }

  return (
    <>
      <AdminListToolbar
        searchValue={query}
        onSearchChange={setQuery}
        searchPlaceholder="ស្វែងរកតាមឈ្មោះ អ៊ីមែល ឬចំនួនទឹកប្រាក់..."
        showClear={hasActiveFilters}
        onClear={clearFilters}
        extra={
          <div className="flex flex-wrap items-end gap-2 sm:gap-3">
            <AdminDateField
              id="savings-date-from"
              label="ពីថ្ងៃ"
              value={dateFrom}
              onChange={setDateFrom}
            />
            <AdminDateField
              id="savings-date-to"
              label="ដល់ថ្ងៃ"
              value={dateTo}
              onChange={setDateTo}
              min={dateFrom || undefined}
            />
          </div>
        }
        filterSummary={
          <>
            បង្ហាញ <span className="font-semibold text-gray-900">{filtered.length}</span> នៃ{' '}
            <span className="font-semibold text-gray-900">{savings.length}</span>
          </>
        }
      />

      <div className="overflow-x-auto">
        <table className="w-full min-w-208 text-left text-sm">
          <thead className="border-b border-gray-100 bg-gray-50/80">
            <tr className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              <th className="px-6 py-3.5 md:px-8">សមាជិក</th>
              <th className="px-6 py-3.5">ចំនួនទឹកប្រាក់</th>
              <th className="px-6 py-3.5">ថ្ងៃសន្សំ</th>
              <th className="px-6 py-3.5">ភស្តុតាង</th>
              <th className="px-6 py-3.5">ស្ថានភាព</th>
              <th className="px-6 py-3.5 text-right md:px-8">សកម្មភាព</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {savings.length === 0 && (
              <AdminTableEmpty
                colSpan={6}
                icon={PiggyBank}
                title="មិនមានសំណើរង់ចាំ"
                description="សំណើសន្សំថ្មីរបស់សមាជិកនឹងបង្ហាញនៅទីនេះ។"
              />
            )}

            {savings.length > 0 && filtered.length === 0 && <AdminTableNoResults colSpan={6} />}

            {filtered.map((saving) => (
              <tr key={saving.id} className="transition hover:bg-gray-50/80">
                <td className="px-6 py-4 md:px-8">
                  <Link
                    href={`/admin/members/${saving.member_id}`}
                    className="group block min-w-0"
                  >
                    <p className="font-semibold text-gray-900 transition group-hover:text-blue-700">
                      {relatedMemberName(saving)}
                    </p>
                    <p className="truncate text-xs text-gray-500">{relatedMemberEmail(saving)}</p>
                  </Link>
                </td>
                <td className="px-6 py-4">
                  <p className="text-base font-bold tabular-nums text-gray-900">
                    {money(saving.amount, (saving.currency as CurrencyCode) ?? 'USD')}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-400">
                    ដាក់ស្នើ {formatDate(saving.created_at)}
                  </p>
                </td>
                <td className="px-6 py-4 text-gray-600">{formatDate(saving.saving_date)}</td>
                <td className="px-6 py-4">
                  {saving.evidenceSignedUrl ? (
                    <AdminExternalLink href={saving.evidenceSignedUrl}>មើលភស្តុតាង</AdminExternalLink>
                  ) : (
                    <span className="inline-flex bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-500">
                      {saving.evidence_url ? 'មិនអាចបង្ហាញ' : 'មិនមាន'}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <SavingStatusBadge status={saving.status as SavingStatus} />
                </td>
                <td className="px-6 py-4 text-right md:px-8">
                  <SavingActions
                    savingId={saving.id}
                    memberName={relatedMemberName(saving)}
                    amount={saving.amount}
                    currency={saving.currency}
                    status={saving.status}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

function recordDateMs(saving: SavingListItem) {
  const raw = saving.saving_date ?? saving.created_at
  if (!raw) return null
  const date = new Date(raw)
  return Number.isNaN(date.getTime()) ? null : date.getTime()
}

function startOfDay(isoDate: string) {
  const [y, m, d] = isoDate.split('-').map(Number)
  return new Date(y, m - 1, d, 0, 0, 0, 0).getTime()
}

function endOfDay(isoDate: string) {
  const [y, m, d] = isoDate.split('-').map(Number)
  return new Date(y, m - 1, d, 23, 59, 59, 999).getTime()
}
