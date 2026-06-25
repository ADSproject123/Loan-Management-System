'use client'

import { useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { CreditCard, X } from 'lucide-react'
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
                    <button
                      type="button"
                      onClick={() => setPreviewUrl(repayment.evidenceSignedUrl)}
                      className="inline-flex items-center rounded-lg border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-800 transition hover:bg-brand-100"
                    >
                      មើលភស្តុតាង
                    </button>
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

      {previewUrl && createPortal(
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm"
          onClick={() => setPreviewUrl(null)}
        >
          <div
            className="relative max-h-[90vh] max-w-3xl w-full overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3.5">
              <p className="text-sm font-semibold text-slate-800">ភស្តុតាង</p>
              <button
                type="button"
                onClick={() => setPreviewUrl(null)}
                className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {previewUrl.toLowerCase().includes('.pdf') ? (
              <div className="flex flex-col items-center gap-4 p-8 text-center">
                <p className="text-sm text-slate-600">មិនអាចបង្ហាញ PDF នៅក្នុងផ្ទាំងនេះ</p>
                <a
                  href={previewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg bg-brand-950 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800"
                >
                  បើក PDF
                </a>
              </div>
            ) : (
              <div className="overflow-auto">
                <img
                  src={previewUrl}
                  alt="ភស្តុតាង"
                  className="block max-h-[80vh] w-full object-contain"
                />
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  )
}

