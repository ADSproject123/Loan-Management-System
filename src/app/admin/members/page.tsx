import { Clock, UserCheck, UserMinus, Users } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/admin'
import { approveMember } from '@/app/actions/admin'
import { MembersList, type MemberListItem } from '@/app/admin/members/MembersList'
import { AdminPageHeader, AdminPagination, AdminStatCard } from '@/components/admin'

export default async function AdminMembersPage({
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

  const { data } = await admin
    .from('members')
    .select('id, full_name, email, phone, status, created_at')
    .order('created_at', { ascending: false })
    .range(from, to)

  const members = (data ?? []) as MemberListItem[]
  const hasNext = members.length === pageSize
  const hasPrev = page > 1

  const stats = {
    total: members.length,
    pending: members.filter((m) => m.status === 'pending').length,
    active: members.filter((m) => m.status === 'active').length,
    suspended: members.filter((m) => m.status === 'suspended').length,
  }

  return (
    <main className="space-y-8 p-6 md:p-8">
      <AdminPageHeader
        title="សមាជិក"
        description="ត្រួតពិនិត្យការចុះឈ្មោះ ផ្ទៀងផ្ទាត់ឯកសារ និងអនុម័តគណនី។ ចុចលើសមាជិកណាម្នាក់មួយដើម្បីមើលព័ត៌មានលម្អិត និងឯកសារ។"
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AdminStatCard label="សមាជិកទាំងអស់" value={stats.total} icon={Users} tone="blue" />
        <AdminStatCard label="រង់ចាំអនុម័ត" value={stats.pending} icon={Clock} tone="amber" />
        <AdminStatCard label="សកម្ម" value={stats.active} icon={UserCheck} tone="emerald" />
        <AdminStatCard label="ផ្អាក" value={stats.suspended} icon={UserMinus} tone="slate" />
      </div>

      <MembersList members={members} approveAction={approveMember} />

      <AdminPagination
        basePath="/admin/members"
        page={page}
        hasPrev={hasPrev}
        hasNext={hasNext}
      />
    </main>
  )
}
