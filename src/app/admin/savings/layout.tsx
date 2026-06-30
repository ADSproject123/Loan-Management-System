import { AdminPanel } from '@/components/admin'
import { SavingsTabs } from '@/app/admin/savings/SavingsTabs'

export default function AdminSavingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen flex-col">
      <AdminPanel>
        <div className="flex min-h-0 flex-1 flex-col gap-6 px-6 py-6 md:px-8">
          <SavingsTabs />
          <div className="flex min-h-0 flex-1 flex-col">{children}</div>
        </div>
      </AdminPanel>
    </main>
  )
}
