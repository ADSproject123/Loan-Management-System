import { AdminBackLink, AdminPanel } from '@/components/admin'
import { CreateMemberForm } from './CreateMemberForm'

export default function NewMemberPage() {
  return (
    <main>
      <AdminPanel title="បន្ថែមថ្មី" description="គណនីនឹងសកម្មភ្លាមៗ — មិនត្រូវការការអនុម័ត">
        <div className="border-b border-border px-6 py-4 md:px-8">
          <AdminBackLink href="/admin/members">ត្រឡប់</AdminBackLink>
        </div>
        <div className="px-6 py-8 md:px-8">
          <CreateMemberForm />
        </div>
      </AdminPanel>
    </main>
  )
}
