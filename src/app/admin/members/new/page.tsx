import { AdminPanel } from '@/components/admin'
import { CreateMemberForm } from './CreateMemberForm'

export default function NewMemberPage() {
  return (
    <main className="flex h-[100dvh] flex-col overflow-hidden">
      <AdminPanel backHref="/admin/members" fill>
        <CreateMemberForm />
      </AdminPanel>
    </main>
  )
}
