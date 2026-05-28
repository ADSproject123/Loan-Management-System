import { Sidebar } from '@/components/layout/Sidebar'
import { requireMember } from '@/lib/auth/member'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const member = await requireMember()

  return (
    <div className="flex min-h-screen">
      <Sidebar memberName={member.full_name} isAdmin={member.is_admin} />
      <main className="flex-1 overflow-auto bg-gray-50">
        {member.status !== 'active' && (
          <div className="border-b border-yellow-200 bg-yellow-50 px-6 py-3 text-sm text-yellow-800">
            Your account is currently <strong>{member.status}</strong>. Transaction requests are available after admin approval.
          </div>
        )}
        {children}
      </main>
    </div>
  )
}
