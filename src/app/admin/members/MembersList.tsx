'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Users } from 'lucide-react'
import { formatDate } from '@/app/admin/adminUtils'
import type { ActionResult } from '@/app/actions/member'
import type { MemberStatus } from '@/types/database'

export type MemberListItem = {
  id: string
  full_name: string
  email: string
  phone: string | null
  status: MemberStatus
  created_at: string
}

type FilterKey = 'all' | MemberStatus

const filters: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'ទាំងអស់' },
  { key: 'pending', label: 'រង់ចាំ' },
  { key: 'active', label: 'សកម្ម' },
  { key: 'suspended', label: 'ផ្អាក' },
  { key: 'withdrawn', label: 'បានដក' },
]

export function MembersList({
  members,
  approveAction,
  suspendAction,
}: {
  members: MemberListItem[]
  approveAction: (formData: FormData) => Promise<ActionResult>
  suspendAction: (formData: FormData) => Promise<ActionResult>
}) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<FilterKey>('all')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return members.filter((member) => {
      if (filter !== 'all' && member.status !== filter) return false
      if (!q) return true
      return (
        member.full_name.toLowerCase().includes(q) ||
        (member.phone ?? '').includes(q) ||
        member.email.toLowerCase().includes(q)
      )
    })
  }, [members, query, filter])

  const counts = useMemo(() => {
    const tally: Record<FilterKey, number> = {
      all: members.length,
      pending: 0,
      active: 0,
      suspended: 0,
      withdrawn: 0,
    }
    for (const member of members) {
      tally[member.status] += 1
    }
    return tally
  }, [members])

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative max-w-md flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ស្វែងរកតាមឈ្មោះ ឬទូរស័ព្ទ..."
            className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 shadow-xs outline-none transition placeholder:text-gray-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-500/15"
          />
        </div>
        <p className="text-sm text-gray-500">
          បង្ហាញ <span className="font-semibold text-gray-900">{filtered.length}</span> នៃ{' '}
          {members.length} សមាជិក
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {filters.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setFilter(item.key)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              filter === item.key
                ? 'bg-blue-900 text-white shadow-sm'
                : 'bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            {item.label}
            <span
              className={`ml-1.5 tabular-nums ${
                filter === item.key ? 'text-blue-200' : 'text-gray-400'
              }`}
            >
              ({counts[item.key]})
            </span>
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-gray-100 text-gray-400">
              <Users className="h-7 w-7" />
            </span>
            <p className="mt-4 text-base font-semibold text-gray-900">រកមិនឃើញសមាជិក</p>
            <p className="mt-1 max-w-sm text-sm text-gray-500">
              ព្យាយាមផ្លាស់ប្តូរការស្វែងរក ឬជ្រើសរើសតម្រងផ្សេង។
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[40rem] text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <th className="px-5 py-3.5 sm:px-6">ឈ្មោះ</th>
                  <th className="px-5 py-3.5 sm:px-6">ថ្ងៃដាក់ស្នើ</th>
                  <th className="px-5 py-3.5 sm:px-6">ទូរស័ព្ទ</th>
                  <th className="px-5 py-3.5 text-right sm:px-6">សកម្មភាព</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((member) => (
                  <tr
                    key={member.id}
                    onClick={() => router.push(`/admin/members/${member.id}`)}
                    className={`cursor-pointer transition hover:bg-blue-50/50 ${
                      member.status === 'pending' ? 'bg-amber-50/30 hover:bg-amber-50/50' : ''
                    }`}
                  >
                    <td className="px-5 py-4 font-medium text-gray-900 sm:px-6">
                      {member.full_name}
                    </td>
                    <td className="px-5 py-4 text-gray-600 sm:px-6">
                      {formatDate(member.created_at)}
                    </td>
                    <td className="px-5 py-4 text-gray-600 sm:px-6">
                      {member.phone ?? '—'}
                    </td>
                    <td
                      className="px-5 py-4 text-right sm:px-6"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        {member.status !== 'active' && (
                          <QuickActionForm
                            action={approveAction}
                            id={member.id}
                            label="ទទួលយក"
                          />
                        )}
                        {member.status !== 'suspended' && (
                          <QuickActionForm
                            action={suspendAction}
                            id={member.id}
                            label="ផ្អាក"
                            danger
                          />
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
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
            : 'bg-blue-900 text-white hover:bg-blue-800'
        }`}
      >
        {label}
      </button>
    </form>
  )
}
