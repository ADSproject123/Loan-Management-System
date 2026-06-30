import { createAdminClient } from '@/lib/supabase/admin'
import { MembersList, type MemberListItem } from '@/app/admin/members/MembersList'
import { AdminPagination } from '@/components/admin'
import { parseAdminListParams } from '@/lib/admin/pagination'

export async function MembersLedgerContent({
  searchParams,
}: {
  searchParams?: Promise<{ page?: string; size?: string }>
}) {
  const admin = createAdminClient()
  const { page, pageSize, from, to } = parseAdminListParams((await searchParams) ?? {})

  const { data, count: totalCount } = await admin
    .from('members')
    .select('id, full_name, full_name_kh, full_name_en, phone, status, role, created_at', {
      count: 'exact',
    })
    .eq('is_admin', false)
    .neq('status', 'pending')
    .order('created_at', { ascending: false })
    .range(from, to)

  const members = (data ?? []) as MemberListItem[]
  const hasNext = members.length === pageSize
  const hasPrev = page > 1

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <MembersList members={members} />
      <div className="-mx-6 mt-6 border-t border-border bg-surface-muted/50 px-6 py-4 md:-mx-8 md:px-8">
        <AdminPagination
          basePath="/admin/members"
          page={page}
          pageSize={pageSize}
          hasPrev={hasPrev}
          hasNext={hasNext}
          totalCount={totalCount}
        />
      </div>
    </div>
  )
}
