'use client'

import { useMemo, useState } from 'react'
import { Wallet } from 'lucide-react'
import { CapitalRequestStatusBadge } from '@/components/ui/Badge'
import { AdminActionButton } from '@/app/admin/AdminActionButton'
import { decideCapitalRequest } from '@/app/actions/admin'
import { AdminReasonDialogButton } from '@/components/admin/AdminReasonDialogButton'
import { formatDate, money, relatedMemberEmail, relatedMemberName } from '@/app/admin/adminUtils'
import type { CapitalRequestStatus } from '@/types/database'
import {
  AdminListToolbar,
  AdminTableEmpty,
  AdminTableNoResults,
} from '@/components/admin'

export type CapitalRequestListItem = {
  id: string
  amount: number | null
  reason: string | null
  status: string
  continue_saving: boolean | null
  remove_membership: boolean
  rejection_reason?: string | null
  created_at: string
  members?: { full_name?: string | null; email?: string | null } | { full_name?: string | null; email?: string | null }[] | null
}

const STATUS_OPTIONS = [
  { value: '', label: 'ទាំងអស់' },
  { value: 'pending', label: 'រង់ចាំ' },
  { value: 'approved', label: 'បានទទួលយក' },
  { value: 'rejected', label: 'បានបដិសេធ' },
]

export function CapitalRequestsList({ requests }: { requests: CapitalRequestListItem[] }) {
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const hasActiveFilters = Boolean(query.trim() || statusFilter)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return requests.filter((row) => {
      if (statusFilter && row.status !== statusFilter) return false
      if (!q) return true
      const name = relatedMemberName(row).toLowerCase()
      const email = relatedMemberEmail(row).toLowerCase()
      const amount = money(row.amount).toLowerCase()
      return name.includes(q) || email.includes(q) || amount.includes(q)
    })
  }, [requests, query, statusFilter])

  return (
    <>
      <AdminListToolbar
        searchValue={query}
        onSearchChange={setQuery}
        searchPlaceholder="ស្វែងរកតាមឈ្មោះ អ៊ីមែល ឬចំនួនទឹកប្រាក់..."
        selectLabel="ស្ថានភាព"
        selectId="capital-status-filter"
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
            <span className="font-semibold text-gray-900">{requests.length}</span>
          </>
        }
      />

      <div className="overflow-x-auto">
        <table className="w-full min-w-208 text-left text-sm">
          <thead className="border-b border-gray-100 bg-gray-50/80">
            <tr className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              <th className="px-6 py-3.5 md:px-8">សមាជិក</th>
              <th className="px-6 py-3.5">ចំនួនទឹកប្រាក់</th>
              <th className="px-6 py-3.5">មូលហេតុ</th>
              <th className="px-6 py-3.5">បន្ទាប់ពីដក</th>
              <th className="px-6 py-3.5">ស្ថានភាព</th>
              <th className="px-6 py-3.5 text-right md:px-8">សកម្មភាព</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {requests.length === 0 && (
              <AdminTableEmpty
                colSpan={6}
                icon={Wallet}
                title="មិនមានស្នើសុំ"
                description="ស្នើសុំដកដើមទុនរបស់សមាជិកនឹងបង្ហាញនៅទីនេះ។"
              />
            )}
            {requests.length > 0 && filtered.length === 0 && <AdminTableNoResults colSpan={6} />}

            {filtered.map((request) => (
              <tr key={request.id} className="transition hover:bg-gray-50/80">
                <td className="px-6 py-4 md:px-8">
                  <p className="font-semibold text-gray-900">{relatedMemberName(request)}</p>
                  <p className="truncate text-xs text-gray-500">{relatedMemberEmail(request)}</p>
                  <p className="mt-1 text-xs text-gray-400">ដាក់ស្នើ {formatDate(request.created_at)}</p>
                </td>
                <td className="px-6 py-4 font-bold tabular-nums text-gray-900">{money(request.amount)}</td>
                <td className="max-w-xs px-6 py-4 text-gray-600">{request.reason ?? '—'}</td>
                <td className="px-6 py-4 text-gray-600">
                  {request.remove_membership ? 'ដកចូលជាសមាជិក' : 'បន្តសន្សំ'}
                </td>
                <td className="px-6 py-4">
                  <CapitalRequestStatusBadge status={request.status as CapitalRequestStatus} />
                  {request.status === 'rejected' && request.rejection_reason && (
                    <p className="mt-2 max-w-xs text-xs text-red-700">{request.rejection_reason}</p>
                  )}
                </td>
                <td className="px-6 py-4 text-right md:px-8">
                  {request.status === 'pending' && (
                    <div className="flex flex-wrap justify-end gap-2">
                      <AdminActionButton action={decideCapitalRequest} id={request.id} decision="approved">
                        ទទួលយក
                      </AdminActionButton>
                      <AdminReasonDialogButton
                        action={decideCapitalRequest}
                        id={request.id}
                        label="បដិសេធ"
                        extraFields={{ decision: 'rejected' }}
                        dialogTitle="បដិសេធស្នើសុំដកដើមទុន"
                        dialogDescription="សមាជិកនឹងទទួលការជូនដំណឹងជាមួយមូលហេតុបដិសេធ។"
                        reasonLabel="មូលហេតុបដិសេធ"
                        reasonPlaceholder="ពិពណ៌នាមូលហេតុដែលស្នើសុំត្រូវបានបដិសេធ..."
                        confirmLabel="បញ្ជាក់បដិសេធ"
                        successMessage="បានបដិសេធស្នើសុំដើមទុន។"
                      />
                    </div>
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
