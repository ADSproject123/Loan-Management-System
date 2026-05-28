import Link from 'next/link'
import { requireAdmin } from '@/lib/auth/member'
import { AdminSidebar } from '@/components/layout/AdminSidebar'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const admin = await requireAdmin()

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar adminName={admin.full_name} />
      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 border-b border-gray-200 bg-white">
          <div className="flex items-center justify-between px-5 py-4 lg:px-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">SanSam Admin</p>
              <h1 className="text-xl font-bold text-gray-900">Management Dashboard</h1>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <span className="hidden text-gray-500 sm:inline">{admin.full_name}</span>
              <Link href="/dashboard" className="font-medium text-blue-700 hover:text-blue-900">
                Member portal
              </Link>
            </div>
          </div>
        </header>
        {children}
      </div>
    </div>
  )
}
