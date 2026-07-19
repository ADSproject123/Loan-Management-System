import { createAdminClient } from '@/lib/supabase/admin'
import { AdminPanel } from '@/components/admin'
import { InboxList, type InboxMember } from '@/app/admin/messages/InboxList'

export default async function AdminMessagesPage() {
  const admin = createAdminClient()

  const [{ data: members }, { data: messages }] = await Promise.all([
    admin
      .from('members')
      .select('id, full_name, full_name_kh, full_name_en, phone, telegram_chat_id')
      .eq('status', 'active')
      .eq('is_admin', false)
      .order('full_name_kh', { ascending: true }),
    admin
      .from('admin_member_messages')
      .select('member_id, sender_type, body, read_by_admin, created_at')
      .order('created_at', { ascending: false }),
  ])

  const lastMessageByMember = new Map<string, { body: string; created_at: string }>()
  const unreadCountByMember = new Map<string, number>()

  for (const row of messages ?? []) {
    if (!lastMessageByMember.has(row.member_id)) {
      lastMessageByMember.set(row.member_id, { body: row.body, created_at: row.created_at })
    }
    if (row.sender_type === 'member' && !row.read_by_admin) {
      unreadCountByMember.set(row.member_id, (unreadCountByMember.get(row.member_id) ?? 0) + 1)
    }
  }

  const inboxMembers: InboxMember[] = (members ?? []).map((m) => {
    const last = lastMessageByMember.get(m.id)
    return {
      id: m.id,
      full_name: m.full_name,
      full_name_kh: m.full_name_kh,
      full_name_en: m.full_name_en,
      phone: m.phone,
      hasTelegram: Boolean(m.telegram_chat_id),
      lastMessageBody: last?.body ?? null,
      lastMessageAt: last?.created_at ?? null,
      unreadCount: unreadCountByMember.get(m.id) ?? 0,
    }
  })

  // Most-recent-message first; members with no messages yet stay in the
  // alphabetical order the query already returned them in.
  inboxMembers.sort((a, b) => {
    if (a.lastMessageAt && b.lastMessageAt) return a.lastMessageAt < b.lastMessageAt ? 1 : -1
    if (a.lastMessageAt) return -1
    if (b.lastMessageAt) return 1
    return 0
  })

  return (
    <AdminPanel>
      <InboxList members={inboxMembers} />
    </AdminPanel>
  )
}
