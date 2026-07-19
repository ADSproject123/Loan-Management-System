'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth/member'
import { sendTelegramMessage, sendTelegramAudio, sendTelegramPhotoBuffer, sendTelegramDocumentBuffer } from '@/lib/telegram'
import { tgAdminChatMessage } from '@/lib/telegramMessages'
import { uploadPrivateFile, getPrivateFileUrl } from '@/lib/uploads'
import type { MessageSenderType, ChatMessageType } from '@/types/database'

// NOTE: unrelated to the `notifications` table (one-way, templated, no
// sender attribution) — this is the two-way admin<->member chat log.

const CHAT_MESSAGE_COLUMNS =
  'id, member_id, sender_type, sender_admin_id, body, message_type, media_url, media_duration_seconds, media_filename, media_mime_type, created_at'

export type ChatMessageRow = {
  id: string
  member_id: string
  sender_type: MessageSenderType
  sender_admin_id: string | null
  body: string | null
  message_type: ChatMessageType
  media_url: string | null
  media_duration_seconds: number | null
  media_filename: string | null
  media_mime_type: string | null
  created_at: string
}

export type ChatMessage = ChatMessageRow & { mediaSignedUrl: string | null }

/** Voice messages store an R2 key in media_url — resolve it to a playable signed URL. */
export async function withSignedMediaUrls(rows: ChatMessageRow[]): Promise<ChatMessage[]> {
  return Promise.all(
    rows.map(async (row) => ({
      ...row,
      mediaSignedUrl: row.media_url ? await getPrivateFileUrl(row.media_url) : null,
    }))
  )
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
      message_type: 'text',
    })
    .select(CHAT_MESSAGE_COLUMNS)
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

  return { success: true, message: { ...(inserted as ChatMessageRow), mediaSignedUrl: null } }
}

/**
 * Admin records a voice clip in the browser and sends it. `formData` must
 * contain the recorded audio under key "audio" (a Blob/File — whatever
 * container the browser's MediaRecorder produced, e.g. webm/ogg; sent to
 * Telegram as-is via sendAudio, no transcoding to .ogg/Opus).
 */
export async function sendAdminVoiceMessageToMember(
  memberId: string,
  formData: FormData
): Promise<SendAdminMessageResult> {
  const admin = await requireAdmin()
  const file = formData.get('audio')
  if (!(file instanceof File) || file.size === 0) {
    return { success: false, error: 'មិនមានសំឡេងដើម្បីផ្ញើទេ។' }
  }
  const durationSeconds = Number(formData.get('durationSeconds') ?? 0) || null

  const supabase = createAdminClient()
  const { data: target } = await supabase
    .from('members')
    .select('telegram_chat_id')
    .eq('id', memberId)
    .maybeSingle()

  const key = await uploadPrivateFile('chat-media', memberId, 'voice', file)
  if (!key) {
    return { success: false, error: 'មិនអាចផ្ទុកឯកសារសំឡេងបានទេ។ សូមព្យាយាមម្តងទៀត។' }
  }

  const { data: inserted, error } = await supabase
    .from('admin_member_messages')
    .insert({
      member_id: memberId,
      sender_type: 'admin',
      sender_admin_id: admin.id,
      body: null,
      message_type: 'voice',
      media_url: key,
      media_duration_seconds: durationSeconds,
    })
    .select(CHAT_MESSAGE_COLUMNS)
    .single()

  if (error || !inserted) {
    return { success: false, error: 'មិនអាចផ្ញើសារបានទេ។ សូមព្យាយាមម្តងទៀត។' }
  }

  if (target?.telegram_chat_id) {
    const buf = await file.arrayBuffer()
    await sendTelegramAudio(target.telegram_chat_id, buf, file.name || 'voice-message', 'សារជាសំឡេងពីអ្នកគ្រប់គ្រង')
  }

  revalidatePath(`/admin/messages/${memberId}`)
  revalidatePath('/admin/messages')
  revalidatePath('/admin', 'layout')

  const mediaSignedUrl = await getPrivateFileUrl(key)
  return { success: true, message: { ...(inserted as ChatMessageRow), mediaSignedUrl } }
}

/**
 * Admin attaches an arbitrary file. `formData` must contain the file under
 * key "file". Images are sent via sendPhoto (inline preview in Telegram);
 * everything else via sendDocument.
 */
export async function sendAdminFileToMember(
  memberId: string,
  formData: FormData
): Promise<SendAdminMessageResult> {
  const admin = await requireAdmin()
  const file = formData.get('file')
  if (!(file instanceof File) || file.size === 0) {
    return { success: false, error: 'សូមជ្រើសរើសឯកសារដើម្បីផ្ញើ។' }
  }

  const supabase = createAdminClient()
  const { data: target } = await supabase
    .from('members')
    .select('telegram_chat_id')
    .eq('id', memberId)
    .maybeSingle()

  const key = await uploadPrivateFile('chat-media', memberId, 'file', file)
  if (!key) {
    return { success: false, error: 'មិនអាចផ្ទុកឯកសារបានទេ។ សូមព្យាយាមម្តងទៀត។' }
  }

  const { data: inserted, error } = await supabase
    .from('admin_member_messages')
    .insert({
      member_id: memberId,
      sender_type: 'admin',
      sender_admin_id: admin.id,
      body: null,
      message_type: 'file',
      media_url: key,
      media_filename: file.name,
      media_mime_type: file.type || null,
    })
    .select(CHAT_MESSAGE_COLUMNS)
    .single()

  if (error || !inserted) {
    return { success: false, error: 'មិនអាចផ្ញើសារបានទេ។ សូមព្យាយាមម្តងទៀត។' }
  }

  if (target?.telegram_chat_id) {
    const buf = await file.arrayBuffer()
    if (file.type.startsWith('image/')) {
      await sendTelegramPhotoBuffer(target.telegram_chat_id, buf, file.name)
    } else {
      await sendTelegramDocumentBuffer(target.telegram_chat_id, buf, file.name)
    }
  }

  revalidatePath(`/admin/messages/${memberId}`)
  revalidatePath('/admin/messages')
  revalidatePath('/admin', 'layout')

  const mediaSignedUrl = await getPrivateFileUrl(key)
  return { success: true, message: { ...(inserted as ChatMessageRow), mediaSignedUrl } }
}

/** Used by the conversation thread's polling to fetch only new rows. */
export async function getNewMessagesSince(memberId: string, sinceIso: string): Promise<ChatMessage[]> {
  await requireAdmin()
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('admin_member_messages')
    .select(CHAT_MESSAGE_COLUMNS)
    .eq('member_id', memberId)
    .gt('created_at', sinceIso)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('getNewMessagesSince:', error.message)
    return []
  }

  return withSignedMediaUrls((data ?? []) as ChatMessageRow[])
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
