import { createAdminClient } from '@/lib/supabase/admin'
import { approveMember } from '@/app/actions/admin'
import { MembersList, type MemberListItem } from '@/app/admin/members/MembersList'
import { AdminPagination, AdminPanel } from '@/components/admin'
import { parseAdminListParams } from '@/lib/admin/pagination'

export default async function AdminMembersRequestsPage({
  searchParams,
}: {
  searchParams?: { page?: string; size?: string }
}) {
  const admin = createAdminClient()
  const { page, pageSize, from, to } = parseAdminListParams(searchParams, {
    defaultPageSize: 10,
  })

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
    <main className="w-full space-y-8 p-6 md:p-8">
      <AdminPanel
        title="ពាក្យសុំចូលរួម"
        description="សមាជិកថ្មីរង់ចាំអនុម័ត — ពិនិត្យឯកសារ និង ទទួលយកឬបដិសេធ។"
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
        <MembersList members={members} approveAction={approveMember} />
      </AdminPanel>
    </main>
  )
}
