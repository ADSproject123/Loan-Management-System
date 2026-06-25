import 'server-only'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendTelegramMessage } from '@/lib/telegram'

export async function notifyAdmins(title: string, message: string, type = 'info') {
  const admin = createAdminClient()

  const { data: admins, error } = await admin
    .from('members')
    .select('id, telegram_chat_id')
    .eq('is_admin', true)
    .eq('status', 'active')

  if (error) {
    console.error('notifyAdmins:', error.message)
    return
  }

  if (!admins?.length) return

  const { error: insertError } = await admin.from('notifications').insert(
    admins.map((row) => ({
      member_id: row.id,
      title,
      message,
      type,
    }))
  )

  if (insertError) {
    console.error('notifyAdmins insert:', insertError.message)
    return
  }

  revalidatePath('/admin', 'layout')

  await Promise.all(
    admins
      .filter((row) => row.telegram_chat_id)
      .map((row) => sendTelegramMessage(row.telegram_chat_id!, `<b>${title}</b>\n${message}`))
  )
}
