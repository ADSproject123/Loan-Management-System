'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Ban, Trash2, UserCheck, Users, UserX } from 'lucide-react'
import { formatDate } from '@/app/admin/adminUtils'
import { memberKhmerName, memberMatchesSearch } from '@/lib/memberNames'
import { AcceptMemberButton } from '@/app/admin/AcceptMemberButton'
import { SuspendMemberButton } from '@/app/admin/SuspendMemberButton'
import { DenyMemberButton } from '@/app/admin/DenyMemberButton'
import { DeleteMemberButton } from '@/app/admin/DeleteMemberButton'
import { MemberStatusBadge, MemberRoleBadge } from '@/components/ui/Badge'
import type { MemberRole, MemberStatus } from '@/types/database'
import { AdminActionsMenu, AdminListToolbar, AdminTableEmpty, AdminTableNoResults, adminTable, adminTableRowClass } from '@/components/admin'
import { CreateMemberButton } from '@/app/admin/members/CreateMemberButton'

export type MemberListItem = {
  id: string
  full_name: string
  full_name_kh?: string | null
  full_name_en?: string | null
  phone: string | null
  status: MemberStatus
  role: MemberRole
  created_at: string
}

const STATUS_FILTER_OPTIONS = [
  { value: '', label: 'ទាំងអស់' },
  { value: 'active', label: 'សកម្ម' },
  { value: 'suspended', label: 'ផ្អាក' },
  { value: 'rejected', label: 'បដិសេធ' },
  { value: 'withdrawn', label: 'បានដក' },
]

export function MembersList({
  members,
}: {
  members: MemberListItem[]
}) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return members.filter((member) => {
      if (statusFilter && member.status !== statusFilter) return false
      if (!q) return true
      return (
        memberMatchesSearch(member, q) ||
        (member.phone ?? '').includes(q)
      )
    })
  }, [members, query, statusFilter])

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <AdminListToolbar
        searchValue={query}
        onSearchChange={setQuery}
        searchPlaceholder="ស្វែងរកតាមឈ្មោះ ឬទូរស័ព្ទ..."
        selectLabel="ស្ថានភាព"
        selectId="members-status-filter"
        selectValue={statusFilter}
        onSelectChange={setStatusFilter}
        selectOptions={STATUS_FILTER_OPTIONS}
        actions={<CreateMemberButton />}
      />

      <div className={adminTable.wrap}>
        <table className={adminTable.table}>
          <thead className={adminTable.thead}>
            <tr className={adminTable.thRow}>
              <th className={adminTable.thFirst}>ឈ្មោះ</th>
              <th className={adminTable.th}>ថ្ងៃដាក់ស្នើ</th>
              <th className={adminTable.th}>ទូរស័ព្ទ</th>
              <th className={adminTable.th}>តួនាទី</th>
              <th className={adminTable.th}>ស្ថានភាព</th>
              <th className={adminTable.thLast}>សកម្មភាព</th>
            </tr>
          </thead>
          <tbody className={adminTable.tbody}>
            {members.length === 0 && (
              <AdminTableEmpty
                colSpan={6}
                icon={Users}
                title="មិនមានសមាជិក"
                description="សមាជិកថ្មីនឹងបង្ហាញនៅទីនេះ។"
              />
            )}

            {members.length > 0 && filtered.length === 0 && <AdminTableNoResults colSpan={6} />}

            {filtered.map((member) => {
              const displayName = memberKhmerName(member)
              return (
              <tr
                key={member.id}
                onClick={() => router.push(`/admin/members/${member.id}`)}
                className={adminTableRowClass({ pending: member.status === 'pending', clickable: true })}
              >
                <td className={`${adminTable.tdFirst} ${adminTable.namePrimary}`}>
                  {displayName}
                </td>
                <td className={adminTable.tdMuted}>{formatDate(member.created_at)}</td>
                <td className={adminTable.tdMuted}>{member.phone ?? '—'}</td>
                <td className={adminTable.tdMuted}>
                  <MemberRoleBadge role={member.role} plain />
                </td>
                <td className={adminTable.td}>
                  <MemberStatusBadge status={member.status} plain />
                </td>
                <td className={adminTable.tdLast} onClick={(event) => event.stopPropagation()}>
                  <AdminActionsMenu>
                    {member.status !== 'active' && member.status !== 'rejected' && (
                      <AcceptMemberButton
                        memberId={member.id}
                        memberName={displayName}
                        label="ទទួលយក"
                        menuItem
                        icon={UserCheck}
                      />
                    )}
                    {member.status === 'pending' && (
                      <DenyMemberButton
                        memberId={member.id}
                        memberName={displayName}
                        label="បដិសេធ"
                        menuItem
                        icon={UserX}
                      />
                    )}
                    {member.status !== 'suspended' && member.status !== 'pending' && (
                      <SuspendMemberButton
                        memberId={member.id}
                        memberName={displayName}
                        label="ផ្អាក"
                        menuItem
                        icon={Ban}
                      />
                    )}
                    <DeleteMemberButton
                      memberId={member.id}
                      memberName={member.full_name}
                      label="លុប"
                      menuItem
                      icon={Trash2}
                    />
                  </AdminActionsMenu>
                </td>
              </tr>
            )})}
          </tbody>
        </table>
      </div>
    </div>
  )
}
