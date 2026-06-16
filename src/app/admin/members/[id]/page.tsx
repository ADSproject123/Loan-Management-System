import { notFound } from 'next/navigation'
import { AdminBackLink, AdminPanel } from '@/components/admin'
import { createAdminClient } from '@/lib/supabase/admin'
import { formatDate, sumAmounts } from '@/app/admin/adminUtils'
import { getInterestSettings, getLoanInterestPlans, monthlySavingInterest } from '@/lib/interest'
import { isVerifiedSavingForChart } from '@/lib/admin/savingsChartData'
import { getPrivateFileUrl } from '@/lib/uploads'
import type { MemberRole, MemberStatus } from '@/types/database'
import { MemberDetailTabs, type TabId } from './MemberDetailTabs'
import { MemberEditModeProvider } from './MemberEditModeContext'
import { MemberDetailHeaderActions } from './MemberDetailHeaderActions'

interface PageProps {
  params: Promise<{ id: string }>
}

type RefereeRecord = {
  id: string
  full_name: string
  email: string
  phone?: string | null
  status: MemberStatus
}

export default async function AdminMemberDetailPage({ params }: PageProps) {
  const { id } = await params
  const admin = createAdminClient()

  const { data: member } = await admin
    .from('members')
    .select(
      'id, full_name, full_name_kh, full_name_en, email, phone, date_of_birth, address, status, role, id_number, resident_book_number, id_document_url, resident_book_url, referee_id, referee_verified, is_admin, telegram_chat_id, loan_interest_plan_id, emergency_contacts, suspension_reason, suspended_at, rejection_reason, rejected_at, joined_at, created_at, updated_at, referee:referee_id(id, full_name, full_name_kh, full_name_en, email, phone, status)'
    )
    .eq('id', id)
    .maybeSingle()

  if (!member) notFound()

  const [interestSettings, loanInterestPlans] = await Promise.all([
    getInterestSettings(),
    getLoanInterestPlans(true),
  ])

  const [{ data: allSavings }, { data: allLoans }] = await Promise.all([
    admin
      .from('savings')
      .select('id, amount, currency, status, saving_date, created_at, verified_at, verified_by')
      .eq('member_id', id)
      .order('created_at', { ascending: false }),
    admin
      .from('loans')
      .select('id, amount, currency, purpose, status, term_months, created_at')
      .eq('member_id', id)
      .order('created_at', { ascending: false }),
  ])

  const savings = allSavings ?? []
  const loans = allLoans ?? []
  const recentLoans = loans.slice(0, 5)

  const verifiedSavings = savings.filter(isVerifiedSavingForChart)
  const activeLoans = loans.filter((loan) => loan.status === 'active' || loan.status === 'approved')
  const savingsTotal = sumAmounts(verifiedSavings)
  const loanTotal = sumAmounts(activeLoans)
  const savingsCount = verifiedSavings.length
  const loansCount = activeLoans.length
  const monthlySavingInterestAmount = monthlySavingInterest(
    savingsTotal,
    interestSettings.monthlySavingInterestRate
  )

  const [idDocumentUrl, residentBookUrl] = await Promise.all([
    getPrivateFileUrl(member.id_document_url),
    getPrivateFileUrl(member.resident_book_url),
  ])

  const referee = normalizeReferee(member.referee)

  const hasIdDoc = Boolean(member.id_document_url)
  const hasResidentBook = Boolean(member.resident_book_url)
  const docsComplete = hasIdDoc && hasResidentBook

  const defaultTab: TabId = member.status === 'pending' ? 'documents' : 'profile'

  return (
    <main className="flex min-h-screen flex-col">
      <MemberEditModeProvider>
      <AdminPanel>
        <div className="flex min-h-0 flex-1 flex-col">
        <div className="shrink-0 flex flex-col gap-4 border-b border-border px-6 py-4 md:flex-row md:items-center md:justify-between md:px-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <AdminBackLink href="/admin/members">ត្រឡប់ទៅបញ្ជីសមាជិក</AdminBackLink>
            <div className="hidden h-6 w-px bg-border sm:block" aria-hidden />
            <p className="text-sm text-muted">
              ព័ត៌មានលម្អិតសមាជិក · ចូលរួម {formatDate(member.joined_at ?? member.created_at)}
            </p>
          </div>

          <MemberDetailHeaderActions
            memberId={member.id}
            memberName={member.full_name}
            status={member.status as MemberStatus}
          />
        </div>

      {member.status === 'suspended' && member.suspension_reason && (
        <div className="mx-6 mt-4 shrink-0 rounded-xl border border-red-200 bg-red-50 px-5 py-4 md:mx-8">
          <p className="text-sm font-semibold text-red-950">មូលហេតុផ្អាក</p>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-red-900">{member.suspension_reason}</p>
          {member.suspended_at && (
            <p className="mt-2 text-xs text-red-700">ផ្អាកនៅ {formatDate(member.suspended_at)}</p>
          )}
        </div>
      )}

      {member.status === 'rejected' && member.rejection_reason && (
        <div className="mx-6 mt-4 shrink-0 rounded-xl border border-red-200 bg-red-50 px-5 py-4 md:mx-8">
          <p className="text-sm font-semibold text-red-950">មូលហេតុបដិសេធ</p>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-red-900">{member.rejection_reason}</p>
          {member.rejected_at && (
            <p className="mt-2 text-xs text-red-700">បដិសេធនៅ {formatDate(member.rejected_at)}</p>
          )}
        </div>
      )}

      <MemberDetailTabs
        defaultTab={defaultTab}
        member={{
          id: member.id,
          full_name: member.full_name,
          full_name_kh: member.full_name_kh,
          full_name_en: member.full_name_en,
          email: member.email,
          phone: member.phone,
          date_of_birth: member.date_of_birth,
          address: member.address,
          status: member.status as MemberStatus,
          role: (member.role ?? 'member') as MemberRole,
          id_number: member.id_number,
          resident_book_number: member.resident_book_number,
          id_document_url: member.id_document_url,
          resident_book_url: member.resident_book_url,
          referee_verified: member.referee_verified,
          telegram_chat_id: member.telegram_chat_id,
          referee_id: member.referee_id,
          emergency_contacts: parseEmergencyContacts(member.emergency_contacts),
        }}
        referee={referee}
        savings={savings}
        loans={recentLoans}
        savingsTotal={savingsTotal}
        loanTotal={loanTotal}
        savingsCount={savingsCount}
        loansCount={loansCount}
        idDocumentUrl={idDocumentUrl}
        residentBookUrl={residentBookUrl}
        docsComplete={docsComplete}
        loanInterest={{
          assignedPlanId: member.loan_interest_plan_id ?? null,
          plans: loanInterestPlans,
          globalMonthlyLoanInterestRate: interestSettings.monthlyLoanInterestRate,
        }}
        savingInterest={{
          monthlyRate: interestSettings.monthlySavingInterestRate,
          monthlyAmount: monthlySavingInterestAmount,
        }}
      />
        </div>
      </AdminPanel>
      </MemberEditModeProvider>
    </main>
  )
}

function normalizeReferee(value: RefereeRecord | RefereeRecord[] | null): RefereeRecord | null {
  if (!value) return null
  return Array.isArray(value) ? (value[0] ?? null) : value
}

function parseEmergencyContacts(value: unknown): { full_name: string; phone: string }[] {
  if (!Array.isArray(value)) return []
  return value
    .filter(
      (item): item is { full_name: string; phone: string } =>
        Boolean(item) &&
        typeof item === 'object' &&
        typeof (item as { full_name?: string }).full_name === 'string' &&
        typeof (item as { phone?: string }).phone === 'string'
    )
    .map((item) => ({
      full_name: item.full_name,
      phone: item.phone,
    }))
}

