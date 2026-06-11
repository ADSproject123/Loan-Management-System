import { notFound } from 'next/navigation'
import { AdminBackLink, AdminPanel } from '@/components/admin'
import { createAdminClient } from '@/lib/supabase/admin'
import { AcceptMemberButton } from '@/app/admin/AcceptMemberButton'
import { SuspendMemberButton } from '@/app/admin/SuspendMemberButton'
import { DenyMemberButton } from '@/app/admin/DenyMemberButton'
import { MemberRoleBadge } from '@/components/ui/Badge'
import { formatDate, sumAmounts } from '@/app/admin/adminUtils'
import { getInterestSettings, getLoanInterestPlans } from '@/lib/interest'
import { MemberLoanInterestForm } from './MemberLoanInterestForm'
import { isVerifiedSavingForChart } from '@/lib/admin/savingsChartData'
import { getPrivateFileUrl } from '@/lib/uploads'
import type { MemberRole, MemberStatus } from '@/types/database'
import { MemberDetailTabs, type TabId } from './MemberDetailTabs'

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
      'id, full_name, full_name_kh, full_name_en, email, phone, date_of_birth, address, status, role, id_number, resident_book_number, id_document_url, resident_book_url, referee_id, referee_verified, is_admin, telegram_chat_id, loan_interest_plan_id, suspension_reason, suspended_at, rejection_reason, rejected_at, joined_at, created_at, updated_at, referee:referee_id(id, full_name, full_name_kh, full_name_en, email, phone, status)'
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
  const recentSavings = savings.slice(0, 5)
  const recentLoans = loans.slice(0, 5)

  const verifiedSavings = savings.filter(isVerifiedSavingForChart)
  const activeLoans = loans.filter((loan) => loan.status === 'active' || loan.status === 'approved')
  const savingsTotal = sumAmounts(verifiedSavings)
  const loanTotal = sumAmounts(activeLoans)
  const savingsCount = verifiedSavings.length
  const loansCount = activeLoans.length

  const [idDocumentUrl, residentBookUrl] = await Promise.all([
    getPrivateFileUrl(member.id_document_url),
    getPrivateFileUrl(member.resident_book_url),
  ])

  const referee = normalizeReferee(member.referee)

  const hasIdDoc = Boolean(member.id_document_url)
  const hasResidentBook = Boolean(member.resident_book_url)
  const docsComplete = hasIdDoc && hasResidentBook

  const checklist = [
    {
      label: 'អត្តសញ្ញាណប័ណ្ណ',
      done: hasIdDoc,
      detail: hasIdDoc ? 'បានផ្ទុក' : 'មិនបានផ្ទុក',
    },
    {
      label: 'សៀវភៅគ្រួសារ',
      done: hasResidentBook,
      detail: hasResidentBook ? 'បានផ្ទុក' : 'មិនបានផ្ទុក',
    },
    {
      label: 'អ្នកធានា',
      done: Boolean(referee),
      detail: referee
        ? member.referee_verified
          ? 'បានបញ្ជាក់'
          : 'រង់ចាំការបញ្ជាក់'
        : 'មិនបានដាក់',
    },
  ]

  const defaultTab: TabId = member.status === 'pending' ? 'documents' : 'profile'

  return (
    <main>
      <AdminPanel title={member.full_name_kh ?? member.full_name}>
        <div className="flex flex-col gap-4 border-b border-border px-6 py-4 md:flex-row md:items-center md:justify-between md:px-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <AdminBackLink href="/admin/members">ត្រឡប់ទៅបញ្ជីសមាជិក</AdminBackLink>
            <div className="hidden h-6 w-px bg-border sm:block" aria-hidden />
            <p className="text-sm text-muted">
              ព័ត៌មានលម្អិតសមាជិក · ចូលរួម {formatDate(member.joined_at ?? member.created_at)}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
          {member.status === 'active' && (
            <MemberRoleBadge role={(member.role ?? 'member') as MemberRole} />
          )}
          {member.status !== 'active' && member.status !== 'rejected' && (
            <AcceptMemberButton memberId={member.id} memberName={member.full_name} />
          )}
          {member.status === 'active' && (
            <AcceptMemberButton
              mode="role"
              memberId={member.id}
              memberName={member.full_name}
              currentRole={(member.role ?? 'member') as MemberRole}
            />
          )}
          {member.status === 'pending' && (
            <DenyMemberButton memberId={member.id} memberName={member.full_name} />
          )}
          {member.status !== 'suspended' && member.status !== 'pending' && member.status !== 'rejected' && (
            <SuspendMemberButton memberId={member.id} memberName={member.full_name} />
          )}
        </div>
      </div>

      {member.status === 'suspended' && member.suspension_reason && (
        <div className="mx-6 mt-4 rounded-xl border border-red-200 bg-red-50 px-5 py-4 md:mx-8">
          <p className="text-sm font-semibold text-red-950">មូលហេតុផ្អាក</p>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-red-900">{member.suspension_reason}</p>
          {member.suspended_at && (
            <p className="mt-2 text-xs text-red-700">ផ្អាកនៅ {formatDate(member.suspended_at)}</p>
          )}
        </div>
      )}

      {member.status === 'rejected' && member.rejection_reason && (
        <div className="mx-6 mt-4 rounded-xl border border-red-200 bg-red-50 px-5 py-4 md:mx-8">
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
          id_number: member.id_number,
          resident_book_number: member.resident_book_number,
          id_document_url: member.id_document_url,
          resident_book_url: member.resident_book_url,
          referee_verified: member.referee_verified,
          telegram_chat_id: member.telegram_chat_id,
        }}
        referee={referee}
        savings={recentSavings}
        loans={recentLoans}
        savingsTotal={savingsTotal}
        loanTotal={loanTotal}
        savingsCount={savingsCount}
        loansCount={loansCount}
        idDocumentUrl={idDocumentUrl}
        residentBookUrl={residentBookUrl}
        checklist={checklist}
        docsComplete={docsComplete}
        memberLoanInterestForm={
          <MemberLoanInterestForm
            memberId={member.id}
            assignedPlanId={member.loan_interest_plan_id ?? null}
            plans={loanInterestPlans}
            globalMonthlyLoanInterestRate={interestSettings.monthlyLoanInterestRate}
          />
        }
      />
      </AdminPanel>
    </main>
  )
}

function normalizeReferee(value: RefereeRecord | RefereeRecord[] | null): RefereeRecord | null {
  if (!value) return null
  return Array.isArray(value) ? (value[0] ?? null) : value
}

