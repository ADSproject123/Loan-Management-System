'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { PiggyBank } from 'lucide-react'
import { SavingStatusBadge } from '@/components/ui/Badge'
import { SavingActions } from '@/app/admin/savings/SavingActions'
import { formatDate, money, relatedMemberEmail, relatedMemberMatchesSearch, relatedMemberName } from '@/app/admin/adminUtils'
import type { CurrencyCode } from '@/lib/currency'
import type { SavingStatus } from '@/types/database'
import {
  AdminDateField,
  AdminListToolbar,
  AdminTableEmpty,
  AdminTableNoResults,
  EvidencePreviewButton,
  EvidencePreviewModal,
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
  evidenceSignedUrl?: string | null
  members?: { full_name?: string | null; full_name_kh?: string | null; full_name_en?: string | null; email?: string | null } | { full_name?: string | null; full_name_kh?: string | null; full_name_en?: string | null; email?: string | null }[] | null
}

type MemberSavingGroup = {
  member_id: string
  members: SavingListItem['members']
  totalAmount: number
  currency: string | null
  savingCount: number
  latestSavingDate: string | null
  latestCreatedAt: string
  hasPending: boolean
}

const STATUS_FILTER_OPTIONS = [
  { value: '', label: 'ទាំងអស់' },
  { value: 'pending', label: 'សំណើសន្សំ' },
  { value: 'completed', label: 'បានទទួល' },
  { value: 'verified', label: 'verified' },
  { value: 'refunded', label: 'សងប្រាក់វិញ' },
]

function isVerifiedSavingStatus(status: string) {
  return status === 'verified' || status === 'completed'
}

function aggregateByMember(
  savings: SavingListItem[],
  allSavings: SavingListItem[],
  statusFilter: string
): MemberSavingGroup[] {
  const source =
    statusFilter === ''
      ? savings.filter((saving) => isVerifiedSavingStatus(saving.status))
      : savings

  const groups = new Map<string, MemberSavingGroup>()

  for (const saving of source) {
    const amount = Number(saving.amount ?? 0)
    const existing = groups.get(saving.member_id)

    if (!existing) {
      groups.set(saving.member_id, {
        member_id: saving.member_id,
        members: saving.members,
        totalAmount: amount,
        currency: saving.currency,
        savingCount: 1,
        latestSavingDate: saving.saving_date,
        latestCreatedAt: saving.created_at,
        hasPending: allSavings.some(
          (row) => row.member_id === saving.member_id && row.status === 'pending'
        ),
      })
      continue
    }

    existing.totalAmount += amount
    existing.savingCount += 1

    if (
      saving.saving_date &&
      (!existing.latestSavingDate ||
        new Date(saving.saving_date).getTime() > new Date(existing.latestSavingDate).getTime())
    ) {
      existing.latestSavingDate = saving.saving_date
    }

    if (new Date(saving.created_at).getTime() > new Date(existing.latestCreatedAt).getTime()) {
      existing.latestCreatedAt = saving.created_at
    }
  }

  return Array.from(groups.values()).sort(
    (a, b) => new Date(b.latestCreatedAt).getTime() - new Date(a.latestCreatedAt).getTime()
  )
}

export function SavingsList({
  savings,
  mode = 'requests',
}: {
  savings: SavingListItem[]
  mode?: 'ledger' | 'requests'
}) {
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const filteredByStatusAndDate = useMemo(() => {
    const fromMs = dateFrom ? startOfDay(dateFrom) : null
    const toMs = dateTo ? endOfDay(dateTo) : null

    return savings.filter((saving) => {
      if (statusFilter && saving.status !== statusFilter) return false

      if (fromMs !== null || toMs !== null) {
        const recordMs = recordDateMs(saving)
        if (recordMs === null) return false
        if (fromMs !== null && recordMs < fromMs) return false
        if (toMs !== null && recordMs > toMs) return false
      }

      return true
    })
  }, [savings, statusFilter, dateFrom, dateTo])

  const filtered = useMemo(() => {
    if (mode === 'ledger') return filteredByStatusAndDate

    const q = query.trim().toLowerCase()
    if (!q) return filteredByStatusAndDate

    return filteredByStatusAndDate.filter((saving) => {
      const email = relatedMemberEmail(saving).toLowerCase()
      const amount = money(saving.amount, (saving.currency as CurrencyCode) ?? 'USD').toLowerCase()
      const currency = (saving.currency ?? '').toLowerCase()
      return relatedMemberMatchesSearch(saving, q) || email.includes(q) || amount.includes(q) || currency.includes(q)
    })
  }, [filteredByStatusAndDate, mode, query])

  const memberGroups = useMemo(() => {
    if (mode !== 'ledger') return []
    return aggregateByMember(filtered, savings, statusFilter)
  }, [filtered, mode, savings, statusFilter])

  const ledgerFiltered = useMemo(() => {
    if (mode !== 'ledger') return []
    const q = query.trim().toLowerCase()
    if (!q) return memberGroups

    return memberGroups.filter((group) => {
      const email = relatedMemberEmail(group).toLowerCase()
      const amount = money(group.totalAmount, (group.currency as CurrencyCode) ?? 'USD').toLowerCase()
      return relatedMemberMatchesSearch(group, q) || email.includes(q) || amount.includes(q)
    })
  }, [memberGroups, mode, query])

  const displayRows = mode === 'ledger' ? ledgerFiltered : filtered
  const totalLedgerMembers = useMemo(() => {
    if (mode !== 'ledger') return 0
    return aggregateByMember(savings, savings, statusFilter).length
  }, [mode, savings, statusFilter])

  return (
    <>
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
          mode === 'ledger' ? (
            <>
              បង្ហាញ <span className="font-semibold text-foreground">{displayRows.length}</span> នៃ{' '}
              <span className="font-semibold text-foreground">{totalLedgerMembers}</span> សមាជិក
            </>
          ) : (
            <>
              បង្ហាញ <span className="font-semibold text-foreground">{filtered.length}</span> នៃ{' '}
              <span className="font-semibold text-foreground">{savings.length}</span>
            </>
          )
        }
      />

      <div className={adminTable.wrap}>
        <table className={`${adminTable.table} min-w-208`}>
          <thead className={adminTable.thead}>
            <tr className={adminTable.thRow}>
              <th className={adminTable.thFirst}>សមាជិក</th>
              <th className={adminTable.th}>
                {mode === 'ledger' ? 'សន្សំសរុប' : 'ចំនួនទឹកប្រាក់'}
              </th>
              {mode === 'ledger' && <th className={adminTable.th}>ចំនួនសន្សំ</th>}
              <th className={adminTable.th}>ថ្ងៃសន្សំ</th>
              {mode === 'requests' && <th className={adminTable.th}>ភស្តុតាង</th>}
              <th className={adminTable.th}>ស្ថានភាព</th>
              {mode === 'requests' && <th className={adminTable.thLast}>សកម្មភាព</th>}
            </tr>
          </thead>
          <tbody className={adminTable.tbody}>
            {savings.length === 0 && (
              <AdminTableEmpty
                colSpan={mode === 'ledger' ? 6 : 6}
                icon={PiggyBank}
                title="មិនមានការសន្សំ"
                description="ការដាក់សន្សំរបស់សមាជិកនឹងបង្ហាញនៅទីនេះ។"
              />
            )}

            {savings.length > 0 && displayRows.length === 0 && (
              <AdminTableNoResults colSpan={mode === 'ledger' ? 6 : 6} />
            )}

            {mode === 'ledger' &&
              ledgerFiltered.map((group) => (
                <tr key={group.member_id} className={adminTableRowClass({ pending: group.hasPending })}>
                  <td className={adminTable.tdFirst}>
                    <Link href={`/admin/members/${group.member_id}`} className="group block min-w-0">
                      <p className={`${adminTable.namePrimary} transition group-hover:text-brand-700`}>
                        {relatedMemberName(group)}
                      </p>
                    </Link>
                  </td>
                  <td className={adminTable.td}>
                    <p className={adminTable.amountPrimary}>
                      {money(group.totalAmount, (group.currency as CurrencyCode) ?? 'USD')}
                    </p>
                  </td>
                  <td className={adminTable.td}>
                    <p className={adminTable.amountPrimary}>{group.savingCount} ដង</p>
                  </td>
                  <td className={adminTable.tdMuted}>{formatDate(group.latestSavingDate)}</td>
                  <td className={adminTable.td}>
                    {group.hasPending ? (
                      <SavingStatusBadge status="pending" plain />
                    ) : (
                      <SavingStatusBadge status="completed" plain />
                    )}
                  </td>
                </tr>
              ))}

            {mode === 'requests' &&
              filtered.map((saving) => (
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
                  <td className={adminTable.td} onClick={(event) => event.stopPropagation()}>
                    {saving.evidenceSignedUrl ? (
                      <EvidencePreviewButton onClick={() => setPreviewUrl(saving.evidenceSignedUrl!)} />
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

    <EvidencePreviewModal url={previewUrl} onClose={() => setPreviewUrl(null)} />
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
