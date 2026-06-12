'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CreditCard, CheckCircle2 } from 'lucide-react'
import { SavingStatusBadge } from '@/components/ui/Badge'
import { verifyRepayment } from '@/app/actions/admin'
import { formatDate, money, relatedMemberEmail, relatedMemberName } from '@/app/admin/adminUtils'
import type { CurrencyCode } from '@/lib/currency'
import type { SavingStatus } from '@/types/database'
import {
  AdminActionButton,
  AdminActionsMenu,
  AdminExternalLink,
  AdminListToolbar,
  AdminTableEmpty,
  AdminTableNoResults,
  adminTable,
  adminTableRowClass,
} from '@/components/admin'

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
  members?: { full_name?: string | null; email?: string | null } | { full_name?: string | null; email?: string | null }[] | null
}

const STATUS_OPTIONS = [
  { value: '', label: 'ទាំងអស់' },
  { value: 'pending', label: 'រង់ចាំ' },
  { value: 'completed', label: 'បានទទួល' },
  { value: 'verified', label: 'verified' },
]

export function RepaymentsList({
  repayments,
  showVerifyAction = true,
  initialStatusFilter = '',
}: {
  repayments: RepaymentListItem[]
  showVerifyAction?: boolean
  initialStatusFilter?: string
}) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState(initialStatusFilter)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return repayments.filter((row) => {
      if (statusFilter && row.status !== statusFilter) return false
      if (!q) return true
      const name = relatedMemberName(row).toLowerCase()
      const email = relatedMemberEmail(row).toLowerCase()
      const amount = money(row.amount, (row.currency as CurrencyCode) ?? 'USD').toLowerCase()
      return name.includes(q) || email.includes(q) || amount.includes(q)
    })
  }, [repayments, query, statusFilter])

  return (
    <>
      <AdminListToolbar
        searchValue={query}
        onSearchChange={setQuery}
        searchPlaceholder="ស្វែងរកតាមឈ្មោះ អ៊ីមែល ឬចំនួនទឹកប្រាក់..."
        selectLabel="ស្ថានភាព"
        selectId="repayment-status-filter"
        selectValue={statusFilter}
        onSelectChange={setStatusFilter}
        selectOptions={STATUS_OPTIONS}
        filterSummary={
          <>
            បង្ហាញ <span className="font-semibold text-foreground">{filtered.length}</span> នៃ{' '}
            <span className="font-semibold text-foreground">{repayments.length}</span>
          </>
        }
      />

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
            {repayments.length === 0 && (
              <AdminTableEmpty
                colSpan={6}
                icon={CreditCard}
                title="មិនមានការសង"
                description="ការសងកម្ជីរបស់សមាជិកនឹងបង្ហាញនៅទីនេះ។"
              />
            )}
            {repayments.length > 0 && filtered.length === 0 && <AdminTableNoResults colSpan={6} />}

            {filtered.map((repayment) => (
              <tr
                key={repayment.id}
                className={adminTableRowClass({
                  pending: repayment.status === 'pending',
                  clickable: true,
                })}
                onClick={() => router.push(`/admin/loans/${repayment.loan_id}`)}
              >
                <td className={adminTable.tdFirst}>
                  <p className={adminTable.namePrimary}>{relatedMemberName(repayment)}</p>
                  <p className={adminTable.nameSecondary}>{relatedMemberEmail(repayment)}</p>
                </td>
                <td className={adminTable.td}>
                  <p className={adminTable.amountPrimary}>
                    {money(repayment.amount, (repayment.currency as CurrencyCode) ?? 'USD')}
                  </p>
                </td>
                <td className={adminTable.tdMuted}>{formatDate(repayment.payment_date)}</td>
                <td className={adminTable.td} onClick={(event) => event.stopPropagation()}>
                  {repayment.evidenceSignedUrl ? (
                    <AdminExternalLink href={repayment.evidenceSignedUrl}>មើលភស្តុតាង</AdminExternalLink>
                  ) : repayment.qr_code_ref?.startsWith('KHQR-') ? (
                    <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700 ring-1 ring-green-200">
                      បានបញ្ជាក់ដោយ Bakong
                    </span>
                  ) : (
                    <span className={adminTable.missingText}>
                      {repayment.evidence_url ? 'មិនអាចបង្ហាញ' : 'មិនមាន'}
                    </span>
                  )}
                </td>
                <td className={adminTable.td}>
                  <SavingStatusBadge status={repayment.status as SavingStatus} plain />
                </td>
                <td className={adminTable.tdLast} onClick={(event) => event.stopPropagation()}>
                  {showVerifyAction && repayment.status === 'pending' ? (
                    <AdminActionsMenu>
                      <AdminActionButton
                        action={verifyRepayment}
                        id={repayment.id}
                        menuItem
                        icon={CheckCircle2}
                      >
                        បានទទួល
                      </AdminActionButton>
                    </AdminActionsMenu>
                  ) : (
                    <span className="text-xs text-muted">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
