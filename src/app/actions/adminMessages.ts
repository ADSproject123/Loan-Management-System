'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth/member'
import { sendTelegramMessage } from '@/lib/telegram'
import { tgAdminChatMessage } from '@/lib/telegramMessages'
import type { MessageSenderType } from '@/types/database'

// NOTE: unrelated to the `notifications` table (one-way, templated, no
// sender attribution) — this is the two-way admin<->member chat log.

export type ChatMessage = {
  id: string
  member_id: string
  sender_type: MessageSenderType
  sender_admin_id: string | null
  body: string
  created_at: string
}

export type SendAdminMessageResult =
  | { success: true; message: ChatMessage }
  | { success: false; error: string }

export async function sendAdminMessageToMember(
  memberId: string,
  body: string
): Promise<SendAdminMessageResult> {
  const admin = await requireAdmin()
  const trimmed = body.trim()
  if (!trimmed) {
    return { success: false, error: 'សូមវាយសារមុននឹងផ្ញើ។' }
  }

  const supabase = createAdminClient()
  const { data: target } = await supabase
    .from('members')
    .select('telegram_chat_id')
    .eq('id', memberId)
    .maybeSingle()

  const { data: inserted, error } = await supabase
    .from('admin_member_messages')
    .insert({
      member_id: memberId,
      sender_type: 'admin',
      sender_admin_id: admin.id,
      body: trimmed,
    })
    .select('id, member_id, sender_type, sender_admin_id, body, created_at')
    .single()

  if (error || !inserted) {
    return { success: false, error: 'មិនអាចផ្ញើសារបានទេ។ សូមព្យាយាមម្តងទៀត។' }
  }

  if (target?.telegram_chat_id) {
    await sendTelegramMessage(target.telegram_chat_id, tgAdminChatMessage(trimmed))
  }

  revalidatePath(`/admin/messages/${memberId}`)
  revalidatePath('/admin/messages')
  revalidatePath('/admin', 'layout')

  return { success: true, message: inserted as ChatMessage }
}

/** Used by the conversation thread's polling to fetch only new rows. */
export async function getNewMessagesSince(memberId: string, sinceIso: string): Promise<ChatMessage[]> {
  await requireAdmin()
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('admin_member_messages')
    .select('id, member_id, sender_type, sender_admin_id, body, created_at')
    .eq('member_id', memberId)
    .gt('created_at', sinceIso)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('getNewMessagesSince:', error.message)
    return []
  }

  return (data ?? []) as ChatMessage[]
}

export async function markConversationRead(memberId: string): Promise<void> {
  await requireAdmin()
  const supabase = createAdminClient()

  await supabase
    .from('admin_member_messages')
    .update({ read_by_admin: true })
    .eq('member_id', memberId)
    .eq('sender_type', 'member')
    .eq('read_by_admin', false)

  revalidatePath('/admin', 'layout')
}
