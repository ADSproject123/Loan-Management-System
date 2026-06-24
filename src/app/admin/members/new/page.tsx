import { AdminPanel } from '@/components/admin'
import { CreateMemberForm } from './CreateMemberForm'

export default function NewMemberPage() {
  return (
    <main>
      <AdminPanel title="បន្ថែមថ្មី" description="គណនីនឹងសកម្មភ្លាមៗ" backHref="/admin/members">
        <div className="px-6 py-8 md:px-8">
          <CreateMemberForm />
        </div>
      </AdminPanel>
    </main>
  )
}
