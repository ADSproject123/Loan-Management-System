'use client'

import { useMemo, useState } from 'react'
import { CheckCircle2, Trash2, Wallet } from 'lucide-react'
import { CapitalRequestStatusBadge } from '@/components/ui/Badge'
import { decideCapitalRequest } from '@/app/actions/admin'
import {
  AdminActionButton,
  AdminActionsMenu,
  AdminListToolbar,
  AdminReasonDialogButton,
  AdminTableEmpty,
  AdminTableNoResults,
  adminTable,
  adminTableRowClass,
} from '@/components/admin'
import { formatDate, money, relatedMemberEmail, relatedMemberName } from '@/app/admin/adminUtils'
import type { CapitalRequestStatus } from '@/types/database'

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
    <div className="flex flex-col flex-1 min-h-0">
      <AdminListToolbar
        searchValue={query}
        onSearchChange={setQuery}
        searchPlaceholder="ស្វែងរកតាមឈ្មោះ អ៊ីមែល ឬចំនួនទឹកប្រាក់..."
        selectLabel="ស្ថានភាព"
        selectId="capital-status-filter"
        selectValue={statusFilter}
        onSelectChange={setStatusFilter}
        selectOptions={STATUS_OPTIONS}
        filterSummary={
          <>
            បង្ហាញ <span className="font-semibold text-foreground">{filtered.length}</span> នៃ{' '}
            <span className="font-semibold text-foreground">{requests.length}</span>
          </>
        }
      />

      <div className={adminTable.wrap}>
        <table className={`${adminTable.table} min-w-208`}>
          <thead className={adminTable.thead}>
            <tr className={adminTable.thRow}>
              <th className={adminTable.thFirst}>សមាជិក</th>
              <th className={adminTable.th}>ដាក់ស្នើ</th>
              <th className={adminTable.th}>ចំនួនទឹកប្រាក់</th>
              <th className={adminTable.th}>មូលហេតុ</th>
              <th className={adminTable.th}>បន្ទាប់ពីដក</th>
              <th className={adminTable.th}>ស្ថានភាព</th>
              <th className={adminTable.thLast}>សកម្មភាព</th>
            </tr>
          </thead>
          <tbody className={adminTable.tbody}>
            {requests.length === 0 && (
              <AdminTableEmpty
                colSpan={7}
                icon={Wallet}
                title="មិនមានស្នើសុំ"
                description="ស្នើសុំដកដើមទុនរបស់សមាជិកនឹងបង្ហាញនៅទីនេះ។"
              />
            )}
            {requests.length > 0 && filtered.length === 0 && <AdminTableNoResults colSpan={7} />}

            {filtered.map((request) => (
              <tr
                key={request.id}
                className={adminTableRowClass({ pending: request.status === 'pending' })}
              >
                <td className={`${adminTable.tdFirst} ${adminTable.namePrimary}`}>
                  {relatedMemberName(request)}
                </td>
                <td className={adminTable.tdMuted}>{formatDate(request.created_at)}</td>
                <td className={adminTable.td}>
                  <p className={adminTable.amountPrimary}>{money(request.amount)}</p>
                </td>
                <td className={`max-w-xs ${adminTable.tdMuted}`}>{request.reason ?? '—'}</td>
                <td className={adminTable.tdMuted}>
                  {request.remove_membership ? 'ឈប់ចូលជាសមាជិក' : 'បន្តសន្សំ'}
                </td>
                <td className={adminTable.td}>
                  <CapitalRequestStatusBadge status={request.status as CapitalRequestStatus} plain />
                  {request.status === 'rejected' && request.rejection_reason && (
                    <p className="mt-1 max-w-xs text-xs text-red-700">{request.rejection_reason}</p>
                  )}
                </td>
                <td className={adminTable.tdLast}>
                  {request.status === 'pending' ? (
                    <AdminActionsMenu>
                      <AdminActionButton
                        action={decideCapitalRequest}
                        id={request.id}
                        decision="approved"
                        menuItem
                        icon={CheckCircle2}
                      >
                        ទទួលយក
                      </AdminActionButton>
                      <AdminReasonDialogButton
                        action={decideCapitalRequest}
                        id={request.id}
                        label="បដិសេធ"
                        menuItem
                        icon={Trash2}
                        extraFields={{ decision: 'rejected' }}
                        dialogTitle="បដិសេធស្នើសុំដកដើមទុន"
                        dialogDescription="សមាជិកនឹងទទួលការជូនដំណឹងជាមួយមូលហេតុបដិសេធ។"
                        reasonLabel="មូលហេតុបដិសេធ"
                        reasonPlaceholder="ពិពណ៌នាមូលហេតុដែលស្នើសុំត្រូវបានបដិសេធ..."
                        confirmLabel="បញ្ជាក់បដិសេធ"
                        successMessage="បានបដិសេធស្នើសុំដើមទុន។"
                      />
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
    </div>
  )
}
