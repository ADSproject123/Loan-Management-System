import Link from 'next/link'
import { Clock, UserCheck, UserX, Users } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/admin'
import { approveMember } from '@/app/actions/admin'
import { MembersList, type MemberListItem } from '@/app/admin/members/MembersList'
import { AdminPagination, AdminPanel, AdminStatCard } from '@/components/admin'
import { parseAdminListParams } from '@/lib/admin/pagination'

export default async function AdminMembersPage({
  searchParams,
}: {
  searchParams?: { page?: string; size?: string }
}) {
  const admin = createAdminClient()
  const { page, pageSize, from, to } = parseAdminListParams(searchParams)

  const [
    { data },
    { count: totalCount },
    { count: activeCount },
    { count: pendingCount },
    { count: suspendedCount },
  ] = await Promise.all([
    admin
      .from('members')
      .select('id, full_name, email, phone, status, created_at')
      .order('created_at', { ascending: false })
      .range(from, to),
    admin.from('members').select('id', { count: 'exact', head: true }),
    admin.from('members').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    admin.from('members').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    admin.from('members').select('id', { count: 'exact', head: true }).eq('status', 'suspended'),
  ])

  const members = (data ?? []) as MemberListItem[]
  const hasNext = members.length === pageSize
  const hasPrev = page > 1

  return (
    <main className="w-full space-y-8 p-6 md:p-8">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 *:h-full">
        <AdminStatCard label="សមាជិកសរុប" value={totalCount ?? 0} icon={Users} tone="slate" />
        <AdminStatCard label="សមាជិកសកម្ម" value={activeCount ?? 0} icon={UserCheck} tone="blue" />
        <Link href="/admin/members/requests" className="block h-full transition hover:opacity-95">
          <AdminStatCard
            label="រង់ចាំអនុម័ត"
            value={pendingCount ?? 0}
            icon={Clock}
            tone="amber"
          />
        </Link>
        <AdminStatCard label="ផ្អាក" value={suspendedCount ?? 0} icon={UserX} tone="amber" />
      </div>

      <AdminPanel
        title="បញ្ជីសមាជិក"
        description="គ្រប់គ្រងសមាជិក — ស្វែងរក តម្រងតាមស្ថានភាព និង អនុម័តពាក្យសុំ។"
        footer={
          <AdminPagination
            basePath="/admin/members"
            page={page}
            pageSize={pageSize}
            hasPrev={hasPrev}
            hasNext={hasNext}
            totalCount={totalCount}
          />
        }
      >
        <MembersList members={members} approveAction={approveMember} />
      </AdminPanel>
    </main>
  )
}
