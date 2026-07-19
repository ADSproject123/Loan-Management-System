'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { MessageCircle } from 'lucide-react'
import { memberKhmerName, memberMatchesSearch } from '@/lib/memberNames'
import { formatKhmerDateTime } from '@/lib/dates'
import { AdminListToolbar } from '@/components/admin'

export type InboxMember = {
  id: string
  full_name: string
  full_name_kh?: string | null
  full_name_en?: string | null
  phone: string | null
  hasTelegram: boolean
  lastMessageBody: string | null
  lastMessageAt: string | null
  unreadCount: number
}

export function InboxList({ members }: { members: InboxMember[] }) {
  const router = useRouter()
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return members
    return members.filter(
      (member) => memberMatchesSearch(member, q) || (member.phone ?? '').includes(q)
    )
  }, [members, query])

  return (
    <div className="flex flex-1 flex-col min-h-0">
      <AdminListToolbar
        searchValue={query}
        onSearchChange={setQuery}
        searchPlaceholder="ស្វែងរកតាមឈ្មោះ ឬទូរស័ព្ទ..."
      />

      {members.length === 0 && (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 py-16 text-center">
          <MessageCircle className="h-8 w-8 text-muted" />
          <p className="text-sm font-semibold text-foreground">មិនមានសមាជិកទេ</p>
        </div>
      )}

      {members.length > 0 && filtered.length === 0 && (
        <div className="px-6 py-10 text-center text-sm text-muted">រកមិនឃើញលទ្ធផល</div>
      )}

      <ul className="divide-y divide-border overflow-y-auto">
        {filtered.map((member) => {
          const displayName = memberKhmerName(member)
          return (
            <li key={member.id}>
              <button
                type="button"
                onClick={() => router.push(`/admin/messages/${member.id}`)}
                className="flex w-full items-center gap-3 px-6 py-4 text-left transition hover:bg-surface-muted/60 md:px-8"
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-surface-muted text-sm font-semibold text-foreground">
                  {displayName.slice(0, 1)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-semibold text-foreground">{displayName}</p>
                    {!member.hasTelegram && (
                      <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                        មិនទាន់ភ្ជាប់ Telegram
                      </span>
                    )}
                  </div>
                  <p className="truncate text-xs text-muted">
                    {member.lastMessageBody ?? 'មិនទាន់មានសារទេ'}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  {member.lastMessageAt && (
                    <span className="text-[11px] text-muted">{formatKhmerDateTime(member.lastMessageAt)}</span>
                  )}
                  {member.unreadCount > 0 && (
                    <span className="grid min-h-5 min-w-5 place-items-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
                      {member.unreadCount > 9 ? '9+' : member.unreadCount}
                    </span>
                  )}
                </div>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
