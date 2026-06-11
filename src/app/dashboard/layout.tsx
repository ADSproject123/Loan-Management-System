import { Sidebar } from '@/components/layout/Sidebar'
import { requireActiveMember } from '@/lib/auth/member'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const member = await requireActiveMember()

  return (
    <div className="min-h-screen">
      <Sidebar memberName={member.full_name} />
      <main className="app-canvas min-h-screen min-w-0 overflow-auto pl-68">{children}</main>
    </div>
  )
}
