import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { createAdminClient } from '@/lib/supabase/admin'
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
  loan: 'ឥណទាន',
}

export default async function AdminReportsPage() {
  const admin = createAdminClient()
  const { data } = await admin
    .from('report_requests')
    .select('id, report_type, period_from, period_to, sent_to_telegram, status, created_at, members(full_name, email)')
    .order('created_at', { ascending: false })

  const reports = data ?? []

  return (
    <main className="space-y-6 p-6 md:p-8 max-w-7xl mx-auto">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">អ្នកគ្រប់គ្រង</p>
        <h2 className="text-2xl font-bold text-gray-900">ការងាររបាយការណ៍</h2>
        <p className="text-sm text-gray-500">តាមដានពាក្យសុំរបាយការណ៍ដែលត្រូវផ្ញើទៅ Telegram។</p>
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
    </main>
  )
}
