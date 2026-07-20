import { DashboardShell } from '@/components/layout/DashboardShell'
import { requireActiveMember } from '@/lib/auth/member'
import { createAdminClient } from '@/lib/supabase/admin'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const member = await requireActiveMember()
  const admin = createAdminClient()
  const telegramLinked = Boolean(member.telegram_chat_id)

  const { count: unreadCount } = await admin
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('member_id', member.id)
    .eq('read', false)

  return (
    <DashboardShell memberName={member.full_name} telegramLinked={telegramLinked} unreadCount={unreadCount ?? 0}>
      {children}
    </DashboardShell>
  )
}
