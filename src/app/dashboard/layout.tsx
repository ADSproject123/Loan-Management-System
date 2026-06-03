import { Sidebar } from '@/components/layout/Sidebar'
import { requireMember } from '@/lib/auth/member'
import { redirect } from 'next/navigation'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const member = await requireMember()

  if (member.status !== 'active') {
    redirect('/pending-approval')
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar memberName={member.full_name} isAdmin={member.is_admin} />
      <main className="app-canvas min-w-0 flex-1 overflow-auto">{children}</main>
    </div>
  )
}
