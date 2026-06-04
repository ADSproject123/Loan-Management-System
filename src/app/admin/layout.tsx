import { requireAdmin } from '@/lib/auth/member'
import { AdminSidebar } from '@/components/layout/AdminSidebar'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const admin = await requireAdmin()

  return (
    <div className="min-h-screen">
      <AdminSidebar adminName={admin.full_name} />
      <main className="app-canvas min-h-screen min-w-0 overflow-auto pl-68">{children}</main>
    </div>
  )
}
