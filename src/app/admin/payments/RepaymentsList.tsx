'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CreditCard } from 'lucide-react'
import { formatDate, money, relatedMemberEmail, relatedMemberMatchesSearch, relatedMemberName } from '@/app/admin/adminUtils'
import {
  normalizeRepaymentPaidStatus,
  REPAYMENT_PAID_LABELS,
  REPAYMENT_PAID_STYLES,
} from '@/lib/admin/repaymentStatus'
import type { CurrencyCode } from '@/lib/currency'
import {
  AdminListToolbar,
  AdminTableEmpty,
  AdminTableNoResults,
  EvidencePreviewButton,
  EvidencePreviewModal,
  adminTable,
  adminTableRowClass,
} from '@/components/admin'
import { RepaymentActions } from '@/app/admin/payments/RepaymentActions'

export type RepaymentListItem = {
  id: string
  loan_id: string
  member_id: string
  amount: number | null
  currency: string | null
  status: string
  evidence_url: string | null
  qr_code_ref?: string | null
  payment_date: string | null
  created_at: string
  evidenceSignedUrl: string | null
  members?: { full_name?: string | null; full_name_kh?: string | null; full_name_en?: string | null; email?: string | null } | { full_name?: string | null; full_name_kh?: string | null; full_name_en?: string | null; email?: string | null }[] | null
}

const STATUS_OPTIONS = [
  { value: '', label: 'ទាំងអស់' },
  { value: 'pending', label: 'មិនទាន់បង់' },
  { value: 'completed', label: 'បានបង់' },
]

export function RepaymentsList({
  repayments,
  initialStatusFilter = '',
  variant = 'all',
  totalCount,
  embed = false,
}: {
  repayments: RepaymentListItem[]
  initialStatusFilter?: string
  variant?: 'all' | 'pending'
  totalCount?: number
  embed?: boolean
}) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState(
    variant === 'pending' ? 'pending' : initialStatusFilter
  )
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const listTotal = totalCount ?? repayments.length

  const filtered = useMemo(() => {
    if (embed) return repayments
    const q = query.trim().toLowerCase()
    return repayments.filter((row) => {
      const paidStatus = normalizeRepaymentPaidStatus(row.status)
      if (statusFilter && paidStatus !== statusFilter) return false
      if (!q) return true
      const email = relatedMemberEmail(row).toLowerCase()
      const amount = money(row.amount, (row.currency as CurrencyCode) ?? 'USD').toLowerCase()
      return relatedMemberMatchesSearch(row, q) || email.includes(q) || amount.includes(q)
    })
  }, [repayments, query, statusFilter, embed])

  return (
    <>
    <div className="flex flex-col flex-1 min-h-0">
      {!embed && (
      <AdminListToolbar
        searchValue={query}
        onSearchChange={setQuery}
        searchPlaceholder="ស្វែងរកតាមឈ្មោះ អ៊ីមែល ឬចំនួនទឹកប្រាក់..."
        selectLabel={variant === 'pending' ? undefined : 'ស្ថានភាព'}
        selectId="repayment-status-filter"
        selectValue={variant === 'pending' ? undefined : statusFilter}
        onSelectChange={variant === 'pending' ? undefined : setStatusFilter}
        selectOptions={variant === 'pending' ? undefined : STATUS_OPTIONS}
        filterSummary={
          <>
            បង្ហាញ <span className="font-semibold text-foreground">{filtered.length}</span> នៃ{' '}
            <span className="font-semibold text-foreground">{repayments.length}</span>
          </>
        }
      />
      )}

      <div className={adminTable.wrap}>
        <table className={`${adminTable.table} min-w-208`}>
          <thead className={adminTable.thead}>
            <tr className={adminTable.thRow}>
              <th className={adminTable.thFirst}>សមាជិក</th>
              <th className={adminTable.th}>ចំនួនទឹកប្រាក់</th>
              <th className={adminTable.th}>ថ្ងៃបង់</th>
              <th className={adminTable.th}>ភស្តុតាង</th>
              <th className={adminTable.th}>ស្ថានភាព</th>
              <th className={adminTable.thLast}>សកម្មភាព</th>
            </tr>
          </thead>
          <tbody className={adminTable.tbody}>
            {listTotal === 0 && (
              <AdminTableEmpty
                colSpan={6}
                icon={CreditCard}
                title={variant === 'pending' ? 'មិនមានការសងរង់ចាំ' : 'មិនមានការសង'}
                description={
                  variant === 'pending'
                    ? 'ការសងកម្ជីដែលសមាជិកបានដាក់នឹងបង្ហាញនៅទីនេះសម្រាប់ទទួល។'
                    : 'ការសងកម្ជីរបស់សមាជិកនឹងបង្ហាញនៅទីនេះ។'
                }
              />
            )}
            {listTotal > 0 && filtered.length === 0 && <AdminTableNoResults colSpan={6} />}

            {filtered.map((repayment) => {
              const paidStatus = normalizeRepaymentPaidStatus(repayment.status)
              return (
              <tr
                key={repayment.id}
                className={adminTableRowClass({
                  pending: paidStatus === 'pending',
                  clickable: true,
                })}
                onClick={() => router.push(`/admin/loans/${repayment.loan_id}`)}
              >
                <td className={`${adminTable.tdFirst} ${adminTable.namePrimary}`}>
                  {relatedMemberName(repayment)}
                </td>
                <td className={adminTable.td}>
                  <p className={adminTable.amountPrimary}>
                    {money(repayment.amount, (repayment.currency as CurrencyCode) ?? 'USD')}
                  </p>
                </td>
                <td className={adminTable.tdMuted}>{formatDate(repayment.payment_date)}</td>
                <td className={adminTable.td} onClick={(event) => event.stopPropagation()}>
                  {repayment.evidenceSignedUrl ? (
                    <EvidencePreviewButton onClick={() => setPreviewUrl(repayment.evidenceSignedUrl)} />
                  ) : (
                    <span className={adminTable.missingText}>
                      {repayment.evidence_url ? 'មិនអាចបង្ហាញ' : 'មិនមាន'}
                    </span>
                  )}
                </td>
                <td className={adminTable.td}>
                  <span
                    className={`text-xs font-semibold ${REPAYMENT_PAID_STYLES[paidStatus]}`}
                  >
                    {REPAYMENT_PAID_LABELS[paidStatus]}
                  </span>
                </td>
                <td className={adminTable.tdLast} onClick={(event) => event.stopPropagation()}>
                  <RepaymentActions
                    repaymentId={repayment.id}
                    status={repayment.status}
                  />
                </td>
              </tr>
            )})}
          </tbody>
        </table>
      </div>
    </div>

      <EvidencePreviewModal url={previewUrl} onClose={() => setPreviewUrl(null)} />
    </>
  )
}

