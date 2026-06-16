import { createAdminClient } from '@/lib/supabase/admin'
import { MembersList, type MemberListItem } from '@/app/admin/members/MembersList'
import { AdminPagination, AdminPanel } from '@/components/admin'
import { parseAdminListParams } from '@/lib/admin/pagination'

export default async function AdminMembersPage({
  searchParams,
}: {
  searchParams?: Promise<{ page?: string; size?: string }>
}) {
  const admin = createAdminClient()
  const { page, pageSize, from, to } = parseAdminListParams((await searchParams) ?? {})

  const [{ data }, { count: totalCount }] = await Promise.all([
    admin
      .from('members')
      .select('id, full_name, email, phone, status, role, created_at')
      .eq('is_admin', false)
      .neq('status', 'pending')
      .order('created_at', { ascending: false })
      .range(from, to),
    admin.from('members').select('id', { count: 'exact', head: true }).eq('is_admin', false).neq('status', 'pending'),
  ])

  const members = (data ?? []) as MemberListItem[]
  const hasNext = members.length === pageSize
  const hasPrev = page > 1

  return (
    <main>
      <AdminPanel
        title="បញ្ជីសមាជិក"
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
        <MembersList members={members} />
      </AdminPanel>
    </main>
  )
}
