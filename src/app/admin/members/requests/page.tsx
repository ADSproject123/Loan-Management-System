import { createAdminClient } from '@/lib/supabase/admin'
import { MembersList, type MemberListItem } from '@/app/admin/members/MembersList'
import { AdminPagination, AdminPanel } from '@/components/admin'
import { parseAdminListParams } from '@/lib/admin/pagination'

export default async function AdminMembersRequestsPage({
  searchParams,
}: {
  searchParams?: Promise<{ page?: string; size?: string }>
}) {
  const admin = createAdminClient()
  const { page, pageSize, from, to } = parseAdminListParams((await searchParams) ?? {}, {
    defaultPageSize: 10,
  })

  const [{ data }, { count: pendingTotal }] = await Promise.all([
    admin
      .from('members')
      .select('id, full_name, email, phone, status, role, created_at')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .range(from, to),
    admin.from('members').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
  ])

  const members = (data ?? []) as MemberListItem[]
  const hasNext = members.length === pageSize
  const hasPrev = page > 1

  return (
    <main>
      <AdminPanel
        title="ពាក្យសុំចូលរួម"
        footer={
          <AdminPagination
            basePath="/admin/members/requests"
            page={page}
            pageSize={pageSize}
            hasPrev={hasPrev}
            hasNext={hasNext}
            totalCount={pendingTotal}
          />
        }
      >
        <MembersList members={members} />
      </AdminPanel>
    </main>
  )
}
