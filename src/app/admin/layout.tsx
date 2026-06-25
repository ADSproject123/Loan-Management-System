import { requireAdmin } from '@/lib/auth/member'
import { AdminSidebar } from '@/components/layout/AdminSidebar'
import { createAdminClient } from '@/lib/supabase/admin'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const admin = await requireAdmin()
  const supabase = createAdminClient()

  const { count: unreadCount } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('member_id', admin.id)
    .eq('read', false)

  return (
    <div className="min-h-screen">
      <AdminSidebar adminName={admin.full_name} initialUnreadCount={unreadCount ?? 0} />
      <main className="app-canvas min-h-screen min-w-0 overflow-auto pl-68">{children}</main>
    </div>
  )
}
