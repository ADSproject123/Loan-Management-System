import { Badge } from '@/components/ui/Badge'
import { createAdminClient } from '@/lib/supabase/admin'
import { markReportSent } from '@/app/actions/admin'
import { AdminActionButton } from '@/app/admin/AdminActionButton'
import { formatDate, relatedMemberEmail, relatedMemberName } from '@/app/admin/adminUtils'
import { AdminPagination, AdminPanel } from '@/components/admin'

const REPORT_STATUS_LABEL: Record<string, string> = {
  pending: 'រង់ចាំ',
  sent: 'បានផ្ញើ',
  failed: 'បរាជ័យ',
}

export default async function AdminLoanReportsPage({
  searchParams,
}: {
  searchParams?: Promise<{ page?: string }>
}) {
  const admin = createAdminClient()
  const pageSize = 15
  const params = (await searchParams) ?? {}
  const page = typeof params.page === 'string' ? Math.max(1, Number(params.page)) : 1
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const { data } = await admin
    .from('report_requests')
    .select(
      'id, report_type, period_from, period_to, sent_to_telegram, status, created_at, members:members!report_requests_member_id_fkey(full_name, email)'
    )
    .eq('report_type', 'loan')
    .order('created_at', { ascending: false })
    .range(from, to)

  const reports = data ?? []
  const hasNext = reports.length === pageSize
  const hasPrev = page > 1

  return (
    <main className="w-full p-6 md:p-8">
      <AdminPanel
        title="របាយការណ៍កម្ជី"
        description="ពាក្យសុំរបាយការណ៍កម្ជី — ផ្ញើតាម Telegram រួចសម្គាល់ថាបានផ្ញើ។"
        footer={
          <AdminPagination
            basePath="/admin/reports/loans"
            page={page}
            hasPrev={hasPrev}
            hasNext={hasNext}
          />
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr className="text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
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
                  <td colSpan={5} className="px-6 py-10 text-center text-sm text-gray-500">
                    រកមិនឃើញពាក្យសុំរបាយការណ៍កម្ជី។
                  </td>
                </tr>
              )}
              {reports.map((report) => (
                <tr key={report.id}>
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-gray-900">{relatedMemberName(report)}</p>
                    <p className="text-xs text-gray-500">{relatedMemberEmail(report)}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {formatDate(report.period_from)} - {formatDate(report.period_to)}
                  </td>
                  <td className="px-6 py-4">
                    <Badge
                      variant={
                        report.status === 'sent'
                          ? 'success'
                          : report.status === 'failed'
                            ? 'error'
                            : 'warning'
                      }
                    >
                      {REPORT_STATUS_LABEL[report.status] ?? report.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{formatDate(report.created_at)}</td>
                  <td className="px-6 py-4">
                    {report.status === 'pending' && (
                      <AdminActionButton action={markReportSent} id={report.id}>
                        សម្គាល់ថាបានផ្ញើ
                      </AdminActionButton>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AdminPanel>
    </main>
  )
}
