import { Clock, Users } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/admin'
import { approveMember } from '@/app/actions/admin'
import { MembersList, type MemberListItem } from '@/app/admin/members/MembersList'
import { AdminPagination, AdminStatCard } from '@/components/admin'

export default async function AdminMembersRequestsPage({
  searchParams,
}: {
  searchParams?: { page?: string }
}) {
  const admin = createAdminClient()
  const pageSize = 10
  const page =
    typeof searchParams?.page === 'string' ? Math.max(1, Number(searchParams.page)) : 1
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const [{ data }, { count: pendingTotal }] = await Promise.all([
    admin
      .from('members')
      .select('id, full_name, email, phone, status, created_at')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .range(from, to),
    admin.from('members').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
  ])

  const members = (data ?? []) as MemberListItem[]
  const hasNext = members.length === pageSize
  const hasPrev = page > 1

  return (
    <main className="space-y-8 p-6 md:p-8">
      <div className="grid gap-4 sm:grid-cols-2">
        <AdminStatCard label="រង់ចាំអនុម័ត" value={pendingTotal ?? 0} icon={Clock} tone="amber" />
        <AdminStatCard label="លើទំព័រនេះ" value={members.length} icon={Users} tone="blue" />
      </div>

      <MembersList members={members} approveAction={approveMember} />

      <AdminPagination
        basePath="/admin/members/requests"
        page={page}
        hasPrev={hasPrev}
        hasNext={hasNext}
      />
    </main>
  )
}
