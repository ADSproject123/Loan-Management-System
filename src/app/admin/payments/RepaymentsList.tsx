'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { CreditCard } from 'lucide-react'
import { SavingStatusBadge } from '@/components/ui/Badge'
import { AdminActionButton } from '@/app/admin/AdminActionButton'
import { verifyRepayment } from '@/app/actions/admin'
import { formatDate, money, relatedMemberEmail, relatedMemberName } from '@/app/admin/adminUtils'
import type { CurrencyCode } from '@/lib/currency'
import type { SavingStatus } from '@/types/database'
import {
  AdminExternalLink,
  AdminListToolbar,
  AdminTableEmpty,
  AdminTableNoResults,
} from '@/components/admin'

export type RepaymentListItem = {
  id: string
  loan_id: string
  member_id: string
  amount: number | null
  currency: string | null
  status: string
  evidence_url: string | null
  payment_date: string | null
  created_at: string
  evidenceSignedUrl: string | null
  members?: { full_name?: string | null; email?: string | null } | { full_name?: string | null; email?: string | null }[] | null
}

const STATUS_OPTIONS = [
  { value: '', label: 'ទាំងអស់' },
  { value: 'pending', label: 'រង់ផ្ទៀងផ្ទាត់' },
  { value: 'completed', label: 'បានផ្ទៀងផ្ទាត់' },
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
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState(initialStatusFilter)

  const hasActiveFilters = Boolean(query.trim() || statusFilter)

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
        showClear={hasActiveFilters}
        onClear={() => {
          setQuery('')
          setStatusFilter('')
        }}
        filterSummary={
          <>
            បង្ហាញ <span className="font-semibold text-gray-900">{filtered.length}</span> នៃ{' '}
            <span className="font-semibold text-gray-900">{repayments.length}</span>
          </>
        }
      />

      <div className="overflow-x-auto">
        <table className="w-full min-w-208 text-left text-sm">
          <thead className="border-b border-gray-100 bg-gray-50/80">
            <tr className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              <th className="px-6 py-3.5 md:px-8">សមាជិក</th>
              <th className="px-6 py-3.5">ចំនួនទឹកប្រាក់</th>
              <th className="px-6 py-3.5">ថ្ងៃបង់</th>
              <th className="px-6 py-3.5">ភស្តុតាង</th>
              <th className="px-6 py-3.5">ស្ថានភាព</th>
              <th className="px-6 py-3.5 text-right md:px-8">សកម្មភាព</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
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
              <tr key={repayment.id} className="transition hover:bg-gray-50/80">
                <td className="px-6 py-4 md:px-8">
                  <Link href={`/admin/members/${repayment.member_id}`} className="group block min-w-0">
                    <p className="font-semibold text-gray-900 transition group-hover:text-blue-700">
                      {relatedMemberName(repayment)}
                    </p>
                    <p className="truncate text-xs text-gray-500">{relatedMemberEmail(repayment)}</p>
                  </Link>
                </td>
                <td className="px-6 py-4">
                  <p className="text-base font-bold tabular-nums text-gray-900">
                    {money(repayment.amount, (repayment.currency as CurrencyCode) ?? 'USD')}
                  </p>
                  <Link
                    href={`/admin/loans/${repayment.loan_id}`}
                    className="mt-0.5 text-xs text-blue-600 hover:text-blue-800"
                  >
                    មើលកម្ជី
                  </Link>
                </td>
                <td className="px-6 py-4 text-gray-600">{formatDate(repayment.payment_date)}</td>
                <td className="px-6 py-4">
                  {repayment.evidenceSignedUrl ? (
                    <AdminExternalLink href={repayment.evidenceSignedUrl}>មើលភស្តុតាង</AdminExternalLink>
                  ) : (
                    <span className="inline-flex bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-500">
                      {repayment.evidence_url ? 'មិនអាចបង្ហាញ' : 'មិនមាន'}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <SavingStatusBadge status={repayment.status as SavingStatus} />
                </td>
                <td className="px-6 py-4 text-right md:px-8">
                  {showVerifyAction && repayment.status === 'pending' && (
                    <AdminActionButton action={verifyRepayment} id={repayment.id}>
                      ផ្ទៀងផ្ទាត់
                    </AdminActionButton>
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
