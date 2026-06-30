import { Suspense } from 'react'
import { AdminListLoading } from '@/components/admin'
import { MembersRequestsContent } from '@/app/admin/members/(tabs)/MembersRequestsContent'

export default function AdminMembersRequestsPage({
  searchParams,
}: {
  searchParams?: Promise<{ page?: string; size?: string }>
}) {
  return (
    <Suspense fallback={<AdminListLoading />}>
      <MembersRequestsContent searchParams={searchParams} />
    </Suspense>
  )
}
