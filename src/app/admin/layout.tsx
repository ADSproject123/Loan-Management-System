import { requireAdmin } from '@/lib/auth/member'
import { AdminSidebar } from '@/components/layout/AdminSidebar'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const admin = await requireAdmin()

  return (
    <div className="flex min-h-screen">
      <AdminSidebar adminName={admin.full_name} />
      <main className="app-canvas min-w-0 flex-1 overflow-auto">{children}</main>
    </div>
  )
}
