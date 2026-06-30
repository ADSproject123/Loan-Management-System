import { Suspense } from 'react'
import { AdminListLoading } from '@/components/admin'
import { MembersLedgerContent } from '@/app/admin/members/(tabs)/MembersLedgerContent'

export default function AdminMembersPage({
  searchParams,
}: {
  searchParams?: Promise<{ page?: string; size?: string }>
}) {
  return (
    <Suspense fallback={<AdminListLoading />}>
      <MembersLedgerContent searchParams={searchParams} />
    </Suspense>
  )
}
