'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Users } from 'lucide-react'
import { formatDate } from '@/app/admin/adminUtils'
import { SuspendMemberButton } from '@/app/admin/SuspendMemberButton'
import { DenyMemberButton } from '@/app/admin/DenyMemberButton'
import type { ActionResult } from '@/app/actions/member'
import type { MemberStatus } from '@/types/database'
import { AdminListToolbar, AdminTableEmpty, AdminTableNoResults } from '@/components/admin'

export type MemberListItem = {
  id: string
  full_name: string
  email: string
  phone: string | null
  status: MemberStatus
  created_at: string
}

const STATUS_FILTER_OPTIONS = [
  { value: '', label: 'ទាំងអស់' },
  { value: 'pending', label: 'រង់ចាំ' },
  { value: 'active', label: 'សកម្ម' },
  { value: 'suspended', label: 'ផ្អាក' },
  { value: 'rejected', label: 'បដិសេធ' },
  { value: 'withdrawn', label: 'បានដក' },
]

export function MembersList({
  members,
  approveAction,
}: {
  members: MemberListItem[]
  approveAction: (formData: FormData) => Promise<ActionResult>
}) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const hasActiveFilters = Boolean(query.trim() || statusFilter)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return members.filter((member) => {
      if (statusFilter && member.status !== statusFilter) return false
      if (!q) return true
      return (
        member.full_name.toLowerCase().includes(q) ||
        (member.phone ?? '').includes(q) ||
        member.email.toLowerCase().includes(q)
      )
    })
  }, [members, query, statusFilter])

  function clearFilters() {
    setQuery('')
    setStatusFilter('')
  }

  return (
    <>
      <AdminListToolbar
        searchValue={query}
        onSearchChange={setQuery}
        searchPlaceholder="ស្វែងរកតាមឈ្មោះ អ៊ីមែល ឬទូរស័ព្ទ..."
        selectLabel="ស្ថានភាព"
        selectId="members-status-filter"
        selectValue={statusFilter}
        onSelectChange={setStatusFilter}
        selectOptions={STATUS_FILTER_OPTIONS}
        showClear={hasActiveFilters}
        onClear={clearFilters}
        filterSummary={
          <>
            បង្ហាញ <span className="font-semibold text-foreground">{filtered.length}</span> នៃ{' '}
            <span className="font-semibold text-foreground">{members.length}</span>
          </>
        }
      />

      <div className="overflow-x-auto">
        <table className="w-full min-w-160 text-left text-sm">
          <thead className="border-b border-border bg-surface-muted/80">
            <tr className="text-xs font-semibold uppercase tracking-wide text-muted">
              <th className="px-6 py-3.5 md:px-8">ឈ្មោះ</th>
              <th className="px-6 py-3.5">ថ្ងៃដាក់ស្នើ</th>
              <th className="px-6 py-3.5">ទូរស័ព្ទ</th>
              <th className="px-6 py-3.5 text-right md:px-8">សកម្មភាព</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {members.length === 0 && (
              <AdminTableEmpty
                colSpan={4}
                icon={Users}
                title="មិនមានសមាជិក"
                description="សមាជិកថ្មីនឹងបង្ហាញនៅទីនេះ។"
              />
            )}

            {members.length > 0 && filtered.length === 0 && <AdminTableNoResults colSpan={4} />}

            {filtered.map((member) => (
              <tr
                key={member.id}
                onClick={() => router.push(`/admin/members/${member.id}`)}
                className={`cursor-pointer transition hover:bg-brand-50/50 ${
                  member.status === 'pending' ? 'bg-amber-50/30 hover:bg-amber-50/50' : ''
                }`}
              >
                <td className="px-6 py-4 font-medium text-foreground md:px-8">
                  <p>{member.full_name}</p>
                  <p className="truncate text-xs text-muted">{member.email}</p>
                </td>
                <td className="px-6 py-4 text-muted">{formatDate(member.created_at)}</td>
                <td className="px-6 py-4 text-muted">{member.phone ?? '—'}</td>
                <td
                  className="px-6 py-4 text-right md:px-8"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    {member.status !== 'active' && (
                      <QuickActionForm action={approveAction} id={member.id} label="ទទួលយក" />
                    )}
                    {member.status === 'pending' && (
                      <DenyMemberButton
                        memberId={member.id}
                        memberName={member.full_name}
                        label="បដិសេធ"
                      />
                    )}
                    {member.status !== 'suspended' && member.status !== 'pending' && (
                      <SuspendMemberButton
                        memberId={member.id}
                        memberName={member.full_name}
                        label="ផ្អាក"
                      />
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

function QuickActionForm({
  action,
  id,
  label,
  danger = false,
}: {
  action: (formData: FormData) => Promise<ActionResult>
  id: string
  label: string
  danger?: boolean
}) {
  return (
    <form
      action={async (formData) => {
        await action(formData)
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
          danger
            ? 'bg-red-600 text-white hover:bg-red-700'
            : 'bg-brand-950 text-white hover:bg-brand-800'
        }`}
      >
        {label}
      </button>
    </form>
  )
}
