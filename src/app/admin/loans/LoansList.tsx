'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronRight, Landmark } from 'lucide-react'
import { LoanStatusBadge } from '@/components/ui/Badge'
import { formatDate, money, relatedMemberEmail, relatedMemberName } from '@/app/admin/adminUtils'
import type { CurrencyCode } from '@/lib/currency'
import type { LoanStatus } from '@/types/database'
import {
  AdminListToolbar,
  AdminTableEmpty,
  AdminTableNoResults,
} from '@/components/admin'

export type LoanListItem = {
  id: string
  member_id: string
  amount: number | null
  currency: string | null
  purpose: string | null
  status: string
  created_at: string
  members?: { full_name?: string | null; email?: string | null } | { full_name?: string | null; email?: string | null }[] | null
}

const STATUS_FILTER_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'ទាំងអស់' },
  { value: 'pending', label: 'រង់ចាំ' },
  { value: 'under_review', label: 'កំពុងពិនិត្យ' },
  { value: 'approved', label: 'បានទទួលយក' },
  { value: 'active', label: 'សកម្ម' },
  { value: 'completed', label: 'បានបញ្ចប់' },
  { value: 'rejected', label: 'បានបដិសេធ' },
]

export function LoansList({ loans }: { loans: LoanListItem[] }) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const hasActiveFilters = Boolean(query.trim() || statusFilter)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()

    return loans.filter((loan) => {
      if (statusFilter && loan.status !== statusFilter) return false
      if (!q) return true

      const name = relatedMemberName(loan).toLowerCase()
      const email = relatedMemberEmail(loan).toLowerCase()
      const purpose = (loan.purpose ?? '').toLowerCase()
      const amount = money(loan.amount, (loan.currency as CurrencyCode) ?? 'USD').toLowerCase()

      return (
        name.includes(q) ||
        email.includes(q) ||
        purpose.includes(q) ||
        amount.includes(q)
      )
    })
  }, [loans, query, statusFilter])

  return (
    <>
      <AdminListToolbar
        searchValue={query}
        onSearchChange={setQuery}
        searchPlaceholder="ស្វែងរកតាមឈ្មោះ អ៊ីមែល គោលបំណង ឬចំនួនទឹកប្រាក់..."
        selectLabel="ស្ថានភាព"
        selectId="loan-status-filter"
        selectValue={statusFilter}
        onSelectChange={setStatusFilter}
        selectOptions={STATUS_FILTER_OPTIONS}
        showClear={hasActiveFilters}
        onClear={() => {
          setQuery('')
          setStatusFilter('')
        }}
        filterSummary={
          <>
            បង្ហាញ <span className="font-semibold text-gray-900">{filtered.length}</span> នៃ{' '}
            <span className="font-semibold text-gray-900">{loans.length}</span>
          </>
        }
      />

      <div className="overflow-x-auto">
        <table className="w-full min-w-160 text-left text-sm">
          <thead className="border-b border-gray-100 bg-gray-50/80">
            <tr className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              <th className="px-6 py-3.5 md:px-8">សមាជិក</th>
              <th className="px-6 py-3.5">ចំនួនទឹកប្រាក់</th>
              <th className="px-6 py-3.5">ស្ថានភាព</th>
              <th className="px-6 py-3.5">ដាក់ស្នើ</th>
              <th className="w-12 px-6 py-3.5 md:px-8" aria-label="មើលលម្អិត" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loans.length === 0 && (
              <AdminTableEmpty
                colSpan={5}
                icon={Landmark}
                title="មិនមានពាក្យសុំកម្ជី"
                description="ពាក្យសុំកម្ជីថ្មីរបស់សមាជិកនឹងបង្ហាញនៅទីនេះ។"
              />
            )}

            {loans.length > 0 && filtered.length === 0 && <AdminTableNoResults colSpan={5} />}

            {filtered.map((loan) => (
              <tr
                key={loan.id}
                className="cursor-pointer transition hover:bg-gray-50/80"
                onClick={() => router.push(`/admin/loans/${loan.id}`)}
              >
                <td className="px-6 py-4 md:px-8">
                  <p className="font-semibold text-gray-900">{relatedMemberName(loan)}</p>
                  <p className="truncate text-xs text-gray-500">{relatedMemberEmail(loan)}</p>
                </td>
                <td className="px-6 py-4">
                  <p className="text-base font-bold tabular-nums text-gray-900">
                    {money(loan.amount, (loan.currency as CurrencyCode) ?? 'USD')}
                  </p>
                  <p className="mt-0.5 line-clamp-1 text-xs text-gray-500">
                    {loan.purpose || '—'}
                  </p>
                </td>
                <td className="px-6 py-4">
                  <LoanStatusBadge status={loan.status as LoanStatus} />
                </td>
                <td className="px-6 py-4 text-gray-600">{formatDate(loan.created_at)}</td>
                <td className="px-6 py-4 text-right md:px-8">
                  <Link
                    href={`/admin/loans/${loan.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center justify-center p-2 text-gray-400 transition hover:bg-blue-50 hover:text-blue-700"
                    aria-label="មើលលម្អិត"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
