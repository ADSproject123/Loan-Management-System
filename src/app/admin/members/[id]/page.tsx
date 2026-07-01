import { notFound } from 'next/navigation'
import { AdminPanel } from '@/components/admin'
import { createAdminClient } from '@/lib/supabase/admin'
import { formatDate, sumAmounts } from '@/app/admin/adminUtils'
import { getInterestSettings, getLoanInterestPlans, monthlySavingInterestForCombinedSavings, fetchMemberLoanInterestRate } from '@/lib/interest'
import { accruedSavingInterestTotal, annotateLoanPaymentSchedule, buildLoanPaymentSchedule, nextInterestDate } from '@/lib/interestCalculations'
import { isVerifiedSavingForChart } from '@/lib/admin/savingsChartData'
import { getPrivateFileUrl } from '@/lib/uploads'
import { predominantCurrency } from '@/lib/currency'
import { fetchMemberLoanEligibility } from '@/lib/loanEligibility'
import { ensureMemberTelegramConnectToken } from '@/app/actions/admin'
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
      'id, full_name, full_name_kh, full_name_en, email, phone, date_of_birth, address, status, role, id_number, resident_book_number, workplace, id_document_url, resident_book_url, referee_id, referee_verified, is_admin, telegram_chat_id, loan_interest_plan_id, emergency_contacts, suspension_reason, suspended_at, rejection_reason, rejected_at, joined_at, created_at, updated_at, referee:referee_id(id, full_name, full_name_kh, full_name_en, email, phone, status)'
    )
    .eq('id', id)
    .maybeSingle()

  if (!member) notFound()

  const telegramConnect = await ensureMemberTelegramConnectToken(member.id)

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
      .select('id, amount, currency, purpose, status, term_months, monthly_interest_rate, start_date, created_at')
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

  // Remaining principal: re-run the amortization schedule for each active loan
  // against its verified repayments so the balance declines as the member pays.
  let loanRemainingBalance = loanTotal
  if (activeLoans.length > 0) {
    const { data: repaymentRows } = await admin
      .from('loan_repayments')
      .select('loan_id, amount')
      .in('loan_id', activeLoans.map((l) => l.id))
      .in('status', ['verified', 'completed'])

    const paidByLoan = (repaymentRows ?? []).reduce<Record<string, number>>((acc, r) => {
      acc[r.loan_id] = (acc[r.loan_id] ?? 0) + (r.amount ?? 0)
      return acc
    }, {})

    loanRemainingBalance = activeLoans.reduce((total, loan) => {
      const paidSoFar = paidByLoan[loan.id] ?? 0
      if (paidSoFar === 0) return total + loan.amount

      const rate = (loan.monthly_interest_rate as number | null) ?? interestSettings.monthlyLoanInterestRate
      const schedule = buildLoanPaymentSchedule(loan.amount, loan.term_months ?? 12, rate, loan.start_date as string | null)
      const annotated = annotateLoanPaymentSchedule(schedule, paidSoFar)

      const remaining = annotated.reduce((sum, row) => {
        if (row.status === 'paid') return sum
        const principalPaid = Math.max(0, row.paidAmount - row.interestPortion)
        return sum + Math.max(row.principalPortion - principalPaid, 0)
      }, 0)

      return total + remaining
    }, 0)
  }
  const savingsCount = verifiedSavings.length
  const loansCount = activeLoans.length
  const monthlySavingInterestAmount = monthlySavingInterestForCombinedSavings(
    verifiedSavings,
    interestSettings.monthlySavingInterestRate
  )
  const accruedSavingInterest = accruedSavingInterestTotal(
    verifiedSavings,
    interestSettings.monthlySavingInterestRate
  )
  const nextSavingInterestDate = nextInterestDate(verifiedSavings)
  const memberCurrency = predominantCurrency(savings)
  const loanEligibility = await fetchMemberLoanEligibility(admin, id)
  const monthlyLoanInterestRate = await fetchMemberLoanInterestRate(
    id,
    interestSettings.monthlyLoanInterestRate
  )

  const [idDocumentUrl, residentBookUrl] = await Promise.all([
    getPrivateFileUrl(member.id_document_url),
    getPrivateFileUrl(member.resident_book_url),
  ])

  const referee = normalizeReferee(member.referee)


  const defaultTab: TabId = member.status === 'pending' ? 'documents' : 'profile'

  return (
    <main className="flex min-h-screen flex-col">
      <MemberEditModeProvider>
      <AdminPanel
        backHref="/admin/members"
        headerActions={
          <MemberDetailHeaderActions
            memberId={member.id}
            memberName={member.full_name}
            status={member.status as MemberStatus}
          />
        }
      >
        <div className="flex min-h-0 flex-1 flex-col gap-6 px-6 py-6 md:px-8">
      {member.status === 'rejected' && member.rejection_reason && (
        <div className="shrink-0 rounded-xl border border-red-200 bg-red-50 px-5 py-4">
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
          workplace: member.workplace ?? null,
          id_document_url: member.id_document_url,
          resident_book_url: member.resident_book_url,
          telegram_chat_id: member.telegram_chat_id,
          referee_id: member.referee_id,
          emergency_contacts: parseEmergencyContacts(member.emergency_contacts),
          suspension_reason: member.suspension_reason,
          suspended_at: member.suspended_at,
        }}
        referee={referee}
        savings={savings}
        loans={recentLoans}
        savingsTotal={savingsTotal}
        loanTotal={loanTotal}
        loanRemainingBalance={loanRemainingBalance}
        savingsCount={savingsCount}
        loansCount={loansCount}
        idDocumentUrl={idDocumentUrl}
        residentBookUrl={residentBookUrl}
        loanInterest={{
          assignedPlanId: member.loan_interest_plan_id ?? null,
          plans: loanInterestPlans,
          globalMonthlyLoanInterestRate: interestSettings.monthlyLoanInterestRate,
        }}
        savingInterest={{
          monthlyRate: interestSettings.monthlySavingInterestRate,
          monthlyAmount: monthlySavingInterestAmount,
          accruedTotal: accruedSavingInterest,
          nextDate: nextSavingInterestDate?.toISOString().slice(0, 10) ?? null,
        }}
        memberCurrency={memberCurrency}
        monthlyLoanInterestRate={monthlyLoanInterestRate}
        loanEligibility={loanEligibility}
        telegramConnectToken={telegramConnect.connectToken}
        telegramLinked={telegramConnect.linked}
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

