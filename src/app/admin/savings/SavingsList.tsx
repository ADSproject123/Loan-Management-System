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
  adminTable,
  adminTableRowClass,
} from '@/components/admin'

export type SavingListItem = {
  id: string
  member_id: string
  amount: number | null
  currency: string | null
  status: string
  evidence_url: string | null
  qr_code_ref?: string | null
  saving_date: string | null
  created_at: string
  evidenceSignedUrl: string | null
  members?: { full_name?: string | null; email?: string | null } | { full_name?: string | null; email?: string | null }[] | null
}

const STATUS_FILTER_OPTIONS = [
  { value: '', label: 'ទាំងអស់' },
  { value: 'pending', label: 'សំណើសន្សំ' },
  { value: 'completed', label: 'បានទទួល' },
  { value: 'verified', label: 'verified' },
  { value: 'refunded', label: 'សងប្រាក់វិញ' },
]

export function SavingsList({ savings }: { savings: SavingListItem[] }) {
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const fromMs = dateFrom ? startOfDay(dateFrom) : null
    const toMs = dateTo ? endOfDay(dateTo) : null

    return savings.filter((saving) => {
      if (statusFilter && saving.status !== statusFilter) return false
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
  }, [savings, query, statusFilter, dateFrom, dateTo])

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <AdminListToolbar
        searchValue={query}
        onSearchChange={setQuery}
        searchPlaceholder="ស្វែងរកតាមឈ្មោះ អ៊ីមែល ឬចំនួនទឹកប្រាក់..."
        selectLabel="ស្ថានភាព"
        selectId="savings-status-filter"
        selectValue={statusFilter}
        onSelectChange={setStatusFilter}
        selectOptions={STATUS_FILTER_OPTIONS}
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
            បង្ហាញ <span className="font-semibold text-foreground">{filtered.length}</span> នៃ{' '}
            <span className="font-semibold text-foreground">{savings.length}</span>
          </>
        }
      />

      <div className={adminTable.wrap}>
        <table className={`${adminTable.table} min-w-208`}>
          <thead className={adminTable.thead}>
            <tr className={adminTable.thRow}>
              <th className={adminTable.thFirst}>សមាជិក</th>
              <th className={adminTable.th}>ចំនួនទឹកប្រាក់</th>
              <th className={adminTable.th}>ថ្ងៃសន្សំ</th>
              <th className={adminTable.th}>ភស្តុតាង</th>
              <th className={adminTable.th}>ស្ថានភាព</th>
              <th className={adminTable.thLast}>សកម្មភាព</th>
            </tr>
          </thead>
          <tbody className={adminTable.tbody}>
            {savings.length === 0 && (
              <AdminTableEmpty
                colSpan={6}
                icon={PiggyBank}
                title="មិនមានការសន្សំ"
                description="ការដាក់សន្សំរបស់សមាជិកនឹងបង្ហាញនៅទីនេះ។"
              />
            )}

            {savings.length > 0 && filtered.length === 0 && <AdminTableNoResults colSpan={6} />}

            {filtered.map((saving) => (
              <tr
                key={saving.id}
                className={adminTableRowClass({ pending: saving.status === 'pending' })}
              >
                <td className={adminTable.tdFirst}>
                  <Link
                    href={`/admin/members/${saving.member_id}`}
                    className="group block min-w-0"
                  >
                    <p className={`${adminTable.namePrimary} transition group-hover:text-brand-700`}>
                      {relatedMemberName(saving)}
                    </p>
                    <p className={adminTable.nameSecondary}>{relatedMemberEmail(saving)}</p>
                  </Link>
                </td>
                <td className={adminTable.td}>
                  <p className={adminTable.amountPrimary}>
                    {money(saving.amount, (saving.currency as CurrencyCode) ?? 'USD')}
                  </p>
                  <p className={adminTable.amountSecondary}>
                    ដាក់ស្នើ {formatDate(saving.created_at)}
                  </p>
                </td>
                <td className={adminTable.tdMuted}>{formatDate(saving.saving_date)}</td>
                <td className={adminTable.td}>
                  {saving.evidenceSignedUrl ? (
                    <AdminExternalLink href={saving.evidenceSignedUrl}>មើលភស្តុតាង</AdminExternalLink>
                  ) : saving.qr_code_ref?.startsWith('KHQR-') ? (
                    <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700 ring-1 ring-green-200">
                      បានបញ្ជាក់ដោយ Bakong
                    </span>
                  ) : (
                    <span className={adminTable.missingText}>
                      {saving.evidence_url ? 'មិនអាចបង្ហាញ' : 'មិនមាន'}
                    </span>
                  )}
                </td>
                <td className={adminTable.td}>
                  <SavingStatusBadge status={saving.status as SavingStatus} plain />
                </td>
                <td className={adminTable.tdLast} onClick={(event) => event.stopPropagation()}>
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
    </div>
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
