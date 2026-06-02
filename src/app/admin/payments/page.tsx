import { Card } from '@/components/ui/Card'
import { SavingStatusBadge } from '@/components/ui/Badge'
import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import { verifyRepayment } from '@/app/actions/admin'
import { AdminActionButton } from '@/app/admin/AdminActionButton'
import { formatDate, money, relatedMemberEmail, relatedMemberName } from '@/app/admin/adminUtils'
import type { SavingStatus } from '@/types/database'

export default async function AdminPaymentsPage({
  searchParams,
}: {
  searchParams?: Promise<{ page?: string }>
}) {
  const admin = createAdminClient()
  const pageSize = 10

  const params = (await searchParams) ?? {}
  const page = typeof params.page === 'string' ? Math.max(1, Number(params.page)) : 1
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const { data } = await admin
    .from('loan_repayments')
    .select('id, amount, currency, status, evidence_url, payment_date, created_at, members:members!loan_repayments_member_id_fkey(full_name, email)')
    .order('created_at', { ascending: false })
    .range(from, to)

  const repaymentRows = data ?? []
  const hasNext = repaymentRows.length === pageSize
  const hasPrev = page > 1

  return (
    <main className="space-y-6 p-6 md:p-8 max-w-7xl mx-auto">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">អ្នកគ្រប់គ្រង</p>
        <h2 className="text-2xl font-bold text-gray-900">ការផ្ទៀងផ្ទាត់ការសងកម្ជី</h2>
        <p className="text-sm text-gray-500">ផ្ទៀងផ្ទាត់រូបអេក្រង់ការសងកម្ជីរបស់សមាជិក។</p>
      </div>

      <Card>
        <h3 className="mb-4 text-lg font-semibold text-gray-900">ការសងកម្ជី</h3>
        <div className="space-y-3">
          {repaymentRows.length === 0 && <p className="text-sm text-gray-500">មិនមានការសងដែលបានដាក់ស្នើទេ។</p>}
          {repaymentRows.map((repayment) => (
            <div key={repayment.id} className="rounded-2xl border border-gray-100 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-gray-900">{money(repayment.amount, repayment.currency ?? 'USD')}</p>
                  <p className="text-sm text-gray-500">{relatedMemberName(repayment)} • {relatedMemberEmail(repayment)}</p>
                  <p className="mt-1 text-xs text-gray-400">ថ្ងៃបង់៖ {formatDate(repayment.payment_date)}</p>
                  <p className="mt-1 truncate text-xs text-gray-400">ភស្តុតាង៖ {repayment.evidence_url ?? 'បាត់'}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <SavingStatusBadge status={repayment.status as SavingStatus} />
                  {repayment.status === 'pending' && <AdminActionButton action={verifyRepayment} id={repayment.id}>ផ្ទៀងផ្ទាត់</AdminActionButton>}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 flex items-center justify-between gap-3">
          {hasPrev ? (
            <Link
              href={`/admin/payments?page=${page - 1}`}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              មុន
            </Link>
          ) : (
            <span className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-semibold text-gray-400">
              មុន
            </span>
          )}

          <span className="text-sm font-semibold text-gray-600">ទំព័រ {page}</span>

          {hasNext ? (
            <Link
              href={`/admin/payments?page=${page + 1}`}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              បន្ទាប់
            </Link>
          ) : (
            <span className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-semibold text-gray-400">
              បន្ទាប់
            </span>
          )}
        </div>
      </Card>
    </main>
  )
}
