import { ReportRequestStatusBadge } from '@/components/ui/Badge'
import { createAdminClient } from '@/lib/supabase/admin'
import { formatDate, relatedMemberName } from '@/app/admin/adminUtils'
import { ReportRequestActions } from '@/app/admin/reports/ReportRequestActions'
import { AdminPagination, AdminPanel, adminTable, adminTableRowClass } from '@/components/admin'
import { parseAdminListParams } from '@/lib/admin/pagination'

export default async function AdminLoanReportsPage({
  searchParams,
}: {
  searchParams?: Promise<{ page?: string; size?: string }>
}) {
  const admin = createAdminClient()
  const params = (await searchParams) ?? {}
  const { page, pageSize, from, to } = parseAdminListParams(params)

  const [{ data }, { count: reportsTotal }] = await Promise.all([
    admin
      .from('report_requests')
      .select(
        'id, report_type, period_from, period_to, sent_to_telegram, status, created_at, members:members!report_requests_member_id_fkey(full_name, email)'
      )
      .eq('report_type', 'loan')
      .order('created_at', { ascending: false })
      .range(from, to),
    admin
      .from('report_requests')
      .select('id', { count: 'exact', head: true })
      .eq('report_type', 'loan'),
  ])

  const reports = data ?? []
  const hasNext = reports.length === pageSize
  const hasPrev = page > 1

  return (
    <main>
      <AdminPanel
        title="របាយការណ៍កម្ជី"
        footer={
          <AdminPagination
            basePath="/admin/reports/loans"
            page={page}
            pageSize={pageSize}
            hasPrev={hasPrev}
            hasNext={hasNext}
            totalCount={reportsTotal}
          />
        }
      >
        <div className={adminTable.wrap}>
          <table className={adminTable.table}>
            <thead className={adminTable.thead}>
              <tr className={adminTable.thRow}>
                <th className={adminTable.thFirst}>សមាជិក</th>
                <th className={adminTable.th}>រយៈពេល</th>
                <th className={adminTable.th}>ស្ថានភាព</th>
                <th className={adminTable.th}>បានស្នើ</th>
                <th className={adminTable.thLast}>សកម្មភាព</th>
              </tr>
            </thead>
            <tbody className={adminTable.tbody}>
              {reports.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-sm text-muted md:px-8">
                    រកមិនឃើញពាក្យសុំរបាយការណ៍កម្ជី។
                  </td>
                </tr>
              )}
              {reports.map((report) => (
                <tr
                  key={report.id}
                  className={adminTableRowClass({ pending: report.status === 'pending' })}
                >
                  <td className={`${adminTable.tdFirst} ${adminTable.namePrimary}`}>
                    {relatedMemberName(report)}
                  </td>
                  <td className={adminTable.tdMuted}>
                    {formatDate(report.period_from)} - {formatDate(report.period_to)}
                  </td>
                  <td className={adminTable.td}>
                    <ReportRequestStatusBadge status={report.status} />
                  </td>
                  <td className={adminTable.tdMuted}>{formatDate(report.created_at)}</td>
                  <td className={adminTable.tdLast}>
                    <ReportRequestActions reportId={report.id} status={report.status} />
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
