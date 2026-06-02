import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import { markReportSent } from '@/app/actions/admin'
import { AdminActionButton } from '@/app/admin/AdminActionButton'
import { formatDate, relatedMemberEmail, relatedMemberName } from '@/app/admin/adminUtils'

const REPORT_STATUS_LABEL: Record<string, string> = {
  pending: 'រង់ចាំ',
  sent: 'បានផ្ញើ',
  failed: 'បរាជ័យ',
}

const REPORT_TYPE_LABEL: Record<string, string> = {
  saving: 'សន្សំ',
  loan: 'កម្ជី',
}

export default async function AdminReportsPage({
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
    .from('report_requests')
    .select('id, report_type, period_from, period_to, sent_to_telegram, status, created_at, members:members!report_requests_member_id_fkey(full_name, email)')
    .eq('report_type', 'loan')
    .order('created_at', { ascending: false })
    .range(from, to)

  const reports = data ?? []

  return (
    <main className="space-y-6 p-6 md:p-8 max-w-7xl mx-auto">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">អ្នកគ្រប់គ្រង</p>
        <h2 className="text-2xl font-bold text-gray-900">ការងាររបាយការណ៍កម្ជី</h2>
        <p className="text-sm text-gray-500">តាមដានពាក្យសុំរបាយការណ៍កម្ជីដែលត្រូវផ្ញើទៅ Telegram។</p>
      </div>

      <Card padding="none" className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr className="text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                <th className="px-6 py-4">របាយការណ៍</th>
                <th className="px-6 py-4">សមាជិក</th>
                <th className="px-6 py-4">រយៈពេល</th>
                <th className="px-6 py-4">ស្ថានភាព</th>
                <th className="px-6 py-4">បានស្នើ</th>
                <th className="px-6 py-4">សកម្មភាព</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {reports.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-sm text-gray-500">រកមិនឃើញពាក្យសុំរបាយការណ៍។</td>
                </tr>
              )}
              {reports.map((report) => (
                <tr key={report.id}>
                  <td className="px-6 py-4 font-medium text-gray-900">{REPORT_TYPE_LABEL[report.report_type] ?? report.report_type}</td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-gray-900">{relatedMemberName(report)}</p>
                    <p className="text-xs text-gray-500">{relatedMemberEmail(report)}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{formatDate(report.period_from)} - {formatDate(report.period_to)}</td>
                  <td className="px-6 py-4">
                    <Badge variant={report.status === 'sent' ? 'success' : report.status === 'failed' ? 'error' : 'warning'}>
                      {REPORT_STATUS_LABEL[report.status] ?? report.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{formatDate(report.created_at)}</td>
                  <td className="px-6 py-4">
                    {report.status !== 'sent' && <AdminActionButton action={markReportSent} id={report.id}>សម្គាល់ថាបានផ្ញើ</AdminActionButton>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="flex items-center justify-between gap-3">
        {page > 1 ? (
          <Link
            href={`/admin/reports?page=${page - 1}`}
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

        {reports.length === pageSize ? (
          <Link
            href={`/admin/reports?page=${page + 1}`}
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
    </main>
  )
}
