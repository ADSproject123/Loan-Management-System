import { Card } from '@/components/ui/Card'
import { CapitalRequestStatusBadge } from '@/components/ui/Badge'
import { createAdminClient } from '@/lib/supabase/admin'
import { decideCapitalRequest } from '@/app/actions/admin'
import { AdminActionButton } from '@/app/admin/AdminActionButton'
import { formatDate, money, relatedMemberEmail, relatedMemberName } from '@/app/admin/adminUtils'
import type { CapitalRequestStatus } from '@/types/database'

export default async function AdminCapitalPage() {
  const admin = createAdminClient()
  const { data } = await admin
    .from('capital_requests')
    .select('id, amount, reason, status, continue_saving, remove_membership, created_at, members(full_name, email)')
    .order('created_at', { ascending: false })

  const requests = data ?? []

  return (
    <main className="space-y-6 p-6 md:p-8 max-w-7xl mx-auto">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">អ្នកគ្រប់គ្រង</p>
        <h2 className="text-2xl font-bold text-gray-900">ការស្នើសុំដើមទុន</h2>
        <p className="text-sm text-gray-500">ត្រួតពិនិត្យការស្នើសុំដកដើមទុនសន្សំ និង ការដកសមាជិកភាព។</p>
      </div>

      <div className="grid gap-4">
        {requests.length === 0 && (
          <Card>
            <p className="text-sm text-gray-500">រកមិនឃើញការស្នើសុំដើមទុន។</p>
          </Card>
        )}
        {requests.map((request) => (
          <Card key={request.id}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-semibold text-gray-900">{money(request.amount)}</h3>
                  <CapitalRequestStatusBadge status={request.status as CapitalRequestStatus} />
                </div>
                <p className="text-sm text-gray-700">{request.reason}</p>
                <p className="mt-1 text-sm text-gray-500">{relatedMemberName(request)} • {relatedMemberEmail(request)}</p>
                <p className="mt-3 text-sm text-gray-500">
                  បន្ទាប់ពីការដក៖ <span className="font-medium text-gray-800">{request.remove_membership ? 'ដកសមាជិកភាព' : 'បន្តសន្សំ'}</span>
                </p>
                <p className="mt-1 text-xs text-gray-400">ដាក់ស្នើ {formatDate(request.created_at)}</p>
              </div>
              {request.status === 'pending' && (
                <div className="flex flex-wrap gap-2">
                  <AdminActionButton action={decideCapitalRequest} id={request.id} decision="approved">អនុម័ត</AdminActionButton>
                  <AdminActionButton action={decideCapitalRequest} id={request.id} decision="rejected" danger>បដិសេធ</AdminActionButton>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    </main>
  )
}
