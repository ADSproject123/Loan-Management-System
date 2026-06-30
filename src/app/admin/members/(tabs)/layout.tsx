import { AdminPanel } from '@/components/admin'
import { MembersTabs } from '@/app/admin/members/MembersTabs'

export default function AdminMembersTabsLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen flex-col">
      <AdminPanel>
        <div className="flex min-h-0 flex-1 flex-col gap-6 px-6 py-6 md:px-8">
          <MembersTabs />
          <div className="flex min-h-0 flex-1 flex-col">{children}</div>
        </div>
      </AdminPanel>
    </main>
  )
}
