import { createAdminClient } from '@/lib/supabase/admin'
import { approveMember } from '@/app/actions/admin'
import { MembersList, type MemberListItem } from '@/app/admin/members/MembersList'
import { AdminPagination } from '@/components/admin'

export default async function AdminMembersPage({
  searchParams,
}: {
  searchParams?: { page?: string }
}) {
  const admin = createAdminClient()
  const pageSize = 15
  const page =
    typeof searchParams?.page === 'string' ? Math.max(1, Number(searchParams.page)) : 1
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const { data } = await admin
    .from('members')
    .select('id, full_name, email, phone, status, created_at')
    .order('created_at', { ascending: false })
    .range(from, to)

  const members = (data ?? []) as MemberListItem[]
  const hasNext = members.length === pageSize
  const hasPrev = page > 1

  return (
    <main className="space-y-6 p-6 md:p-8">
      <MembersList members={members} approveAction={approveMember} />
      <AdminPagination basePath="/admin/members" page={page} hasPrev={hasPrev} hasNext={hasNext} />
    </main>
  )
}
