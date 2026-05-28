import { Card } from '@/components/ui/Card'
import { MemberStatusBadge } from '@/components/ui/Badge'
import { createAdminClient } from '@/lib/supabase/admin'
import { approveMember, suspendMember } from '@/app/actions/admin'
import { AdminActionButton } from '@/app/admin/AdminActionButton'
import { formatDate } from '@/app/admin/adminUtils'
import type { MemberStatus } from '@/types/database'

export default async function AdminMembersPage() {
  const admin = createAdminClient()
  const { data } = await admin
    .from('members')
    .select('id, full_name, email, phone, status, id_number, resident_book_number, id_document_url, resident_book_url, created_at')
    .order('created_at', { ascending: false })

  const members = data ?? []

  return (
    <main className="space-y-6 p-6 md:p-8 max-w-7xl mx-auto">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">Admin</p>
        <h2 className="text-2xl font-bold text-gray-900">Members</h2>
        <p className="text-sm text-gray-500">Review registrations, verify documents, and activate member accounts.</p>
      </div>

      <Card padding="none" className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr className="text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                <th className="px-6 py-4">Member</th>
                <th className="px-6 py-4">Documents</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Submitted</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {members.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-sm text-gray-500">No members found.</td>
                </tr>
              )}
              {members.map((member) => (
                <tr key={member.id} className="align-top">
                  <td className="px-6 py-4">
                    <p className="font-semibold text-gray-900">{member.full_name}</p>
                    <p className="text-sm text-gray-500">{member.email}</p>
                    <p className="text-xs text-gray-400">{member.phone ?? 'No phone'}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    <p>ID: {member.id_document_url ? 'Uploaded' : 'Missing'} {member.id_number ? `(${member.id_number})` : ''}</p>
                    <p>Resident book: {member.resident_book_url ? 'Uploaded' : 'Missing'} {member.resident_book_number ? `(${member.resident_book_number})` : ''}</p>
                  </td>
                  <td className="px-6 py-4">
                    <MemberStatusBadge status={member.status as MemberStatus} />
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{formatDate(member.created_at)}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-2">
                      {member.status !== 'active' && <AdminActionButton action={approveMember} id={member.id}>Approve</AdminActionButton>}
                      {member.status !== 'suspended' && <AdminActionButton action={suspendMember} id={member.id} danger>Suspend</AdminActionButton>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </main>
  )
}
