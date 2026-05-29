import { Card } from '@/components/ui/Card'
import { LoanStatusBadge } from '@/components/ui/Badge'
import { createAdminClient } from '@/lib/supabase/admin'
import { activateLoan, approveLoan, rejectLoan } from '@/app/actions/admin'
import { AdminActionButton } from '@/app/admin/AdminActionButton'
import { formatDate, money, relatedMemberEmail, relatedMemberName } from '@/app/admin/adminUtils'
import type { LoanStatus } from '@/types/database'

export default async function AdminLoansPage() {
  const admin = createAdminClient()
  const { data } = await admin
    .from('loans')
    .select('id, amount, purpose, term_months, interest_rate, status, support_document_url, hard_copy_submitted, thumbprint_submitted, created_at, members(full_name, email)')
    .order('created_at', { ascending: false })

  const loans = data ?? []

  return (
    <main className="space-y-6 p-6 md:p-8 max-w-7xl mx-auto">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">អ្នកគ្រប់គ្រង</p>
        <h2 className="text-2xl font-bold text-gray-900">ការត្រួតពិនិត្យឥណទាន</h2>
        <p className="text-sm text-gray-500">អនុម័ត បដិសេធ និង ដំណើរការពាក្យសុំឥណទានបន្ទាប់ពីការត្រួតពិនិត្យឯកសារ។</p>
      </div>

      <div className="grid gap-4">
        {loans.length === 0 && (
          <Card>
            <p className="text-sm text-gray-500">រកមិនឃើញឥណទាន។</p>
          </Card>
        )}
        {loans.map((loan) => (
          <Card key={loan.id}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-semibold text-gray-900">{money(loan.amount)}</h3>
                  <LoanStatusBadge status={loan.status as LoanStatus} />
                </div>
                <p className="text-sm text-gray-700">{loan.purpose}</p>
                <p className="mt-1 text-sm text-gray-500">{relatedMemberName(loan)} • {relatedMemberEmail(loan)}</p>
                <div className="mt-4 grid gap-3 text-sm text-gray-500 sm:grid-cols-4">
                  <p><span className="font-medium text-gray-700">រយៈពេល៖</span> {loan.term_months ?? 0} ខែ</p>
                  <p><span className="font-medium text-gray-700">អត្រា៖</span> {loan.interest_rate ?? 0}%/ខែ</p>
                  <p><span className="font-medium text-gray-700">ដាក់ស្នើ៖</span> {formatDate(loan.created_at)}</p>
                  <p><span className="font-medium text-gray-700">ឯកសារគាំទ្រ៖</span> {loan.support_document_url ? 'បានផ្ទុក' : 'បាត់'}</p>
                </div>
                <p className="mt-2 text-xs text-gray-400">
                  ច្បាប់ដើម៖ {loan.hard_copy_submitted ? 'បានទទួល' : 'រង់ចាំ'} • ការផ្តិតមេដៃ៖ {loan.thumbprint_submitted ? 'បានទទួល' : 'រង់ចាំ'}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {loan.status === 'under_review' && <AdminActionButton action={approveLoan} id={loan.id}>អនុម័ត</AdminActionButton>}
                {loan.status === 'approved' && <AdminActionButton action={activateLoan} id={loan.id}>ដំណើរការ</AdminActionButton>}
                {loan.status !== 'rejected' && loan.status !== 'completed' && <AdminActionButton action={rejectLoan} id={loan.id} danger>បដិសេធ</AdminActionButton>}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </main>
  )
}
