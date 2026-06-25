import { Sidebar } from '@/components/layout/Sidebar'
import { NotificationBell } from '@/components/layout/NotificationBell'
import { TelegramConnectBanner } from '@/components/telegram/TelegramConnectBanner'
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
    <div className="min-h-screen">
      <Sidebar memberName={member.full_name} telegramLinked={telegramLinked} />
      <div className="flex min-h-screen min-w-0 flex-col pl-68">
        <header className="sticky top-0 z-30 flex items-center justify-end border-b border-slate-200/80 bg-white/90 px-6 py-3 backdrop-blur-md md:px-10">
          <NotificationBell initialUnreadCount={unreadCount ?? 0} />
        </header>
        {!telegramLinked && <TelegramConnectBanner />}
        <main className="app-canvas min-h-0 flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  )
}
