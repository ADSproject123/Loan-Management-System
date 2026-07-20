import { requireAdmin } from '@/lib/auth/member'
import { AdminShell } from '@/components/layout/AdminShell'
import { createAdminClient } from '@/lib/supabase/admin'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const admin = await requireAdmin()
  const supabase = createAdminClient()

  const [{ count: unreadCount }, { count: unreadMessageCount }] = await Promise.all([
    supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('member_id', admin.id)
      .eq('read', false),
    supabase
      .from('admin_member_messages')
      .select('id', { count: 'exact', head: true })
      .eq('sender_type', 'member')
      .eq('read_by_admin', false),
  ])

  return (
    <AdminShell
      adminName={admin.full_name}
      initialUnreadCount={unreadCount ?? 0}
      unreadMessageCount={unreadMessageCount ?? 0}
    >
      {children}
    </AdminShell>
  )
}
