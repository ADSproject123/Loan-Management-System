import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { AdminPanel } from '@/components/admin'
import { memberKhmerName } from '@/lib/memberNames'
import { ConversationThread } from '@/app/admin/messages/[memberId]/ConversationThread'
import { withSignedMediaUrls, type ChatMessageRow } from '@/app/actions/adminMessages'

interface PageProps {
  params: Promise<{ memberId: string }>
}

export default async function AdminMessageThreadPage({ params }: PageProps) {
  const { memberId } = await params
  const admin = createAdminClient()

  const [{ data: member }, { data: messages }] = await Promise.all([
    admin
      .from('members')
      .select('id, full_name, full_name_kh, full_name_en, phone, telegram_chat_id')
      .eq('id', memberId)
      .maybeSingle(),
    admin
      .from('admin_member_messages')
      .select('id, member_id, sender_type, sender_admin_id, body, message_type, media_url, media_duration_seconds, media_filename, media_mime_type, created_at')
      .eq('member_id', memberId)
      .order('created_at', { ascending: true }),
  ])

  if (!member) notFound()

  const initialMessages = await withSignedMediaUrls((messages ?? []) as ChatMessageRow[])

  return (
    <AdminPanel backHref="/admin/messages" headerActions={<span className="text-sm font-semibold text-foreground">{memberKhmerName(member)}</span>} fill>
      <ConversationThread
        memberId={member.id}
        memberName={memberKhmerName(member)}
        hasTelegram={Boolean(member.telegram_chat_id)}
        initialMessages={initialMessages}
      />
    </AdminPanel>
  )
}
