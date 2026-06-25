'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireMember } from '@/lib/auth/member'

export type MemberNotification = {
  id: string
  title: string
  message: string
  read: boolean
  created_at: string
  type?: string | null
}

async function requireNotificationRecipient() {
  const member = await requireMember()
  if (member.status !== 'active') redirect('/pending-approval')
  return member
}

function revalidateNotificationLayouts(member: { is_admin: boolean }) {
  if (member.is_admin) {
    revalidatePath('/admin', 'layout')
    return
  }
  revalidatePath('/dashboard', 'layout')
}

export async function getMemberNotifications(): Promise<MemberNotification[]> {
  const member = await requireNotificationRecipient()
  const admin = createAdminClient()

  const { data, error } = await admin
    .from('notifications')
    .select('id, title, message, read, created_at, type')
    .eq('member_id', member.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('getMemberNotifications:', error.message)
    return []
  }

  return (data ?? []) as MemberNotification[]
}

export async function markAllNotificationsRead(): Promise<{ success: boolean }> {
  const member = await requireNotificationRecipient()
  const admin = createAdminClient()

  const { error } = await admin
    .from('notifications')
    .update({ read: true })
    .eq('member_id', member.id)
    .eq('read', false)

  if (error) {
    console.error('markAllNotificationsRead:', error.message)
    return { success: false }
  }

  revalidateNotificationLayouts(member)
  return { success: true }
}

export async function markNotificationRead(notificationId: string): Promise<{ success: boolean }> {
  const member = await requireNotificationRecipient()
  const admin = createAdminClient()

  const { error } = await admin
    .from('notifications')
    .update({ read: true })
    .eq('id', notificationId)
    .eq('member_id', member.id)

  if (error) {
    console.error('markNotificationRead:', error.message)
    return { success: false }
  }

  revalidateNotificationLayouts(member)
  return { success: true }
}
