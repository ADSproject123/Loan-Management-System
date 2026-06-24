import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { getPrivateFileUrl } from '@/lib/uploads'
import { normalizeCurrency, type CurrencyCode } from '@/lib/currency'
import {
  annotateLoanPaymentSchedule,
  buildLoanPaymentSchedule,
  getInterestSettings,
  resolveLoanInterestRate,
} from '@/lib/interest'
import { fetchAdminLoanDetail } from '@/lib/admin/loanDetail'
import { LoanDetailView } from '@/app/admin/loans/[id]/LoanDetailView'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function AdminLoanDetailPage({ params }: PageProps) {
  const { id } = await params
  const admin = createAdminClient()

  const loan = await fetchAdminLoanDetail(admin, id)

  if (!loan) notFound()

  const [{ data: repayments }, { data: allRepayments }, interestSettings, supportDocumentUrl] =
    await Promise.all([
      admin
        .from('loan_repayments')
        .select('id, amount, currency, status, payment_date, created_at')
        .eq('loan_id', id)
        .order('created_at', { ascending: false })
        .limit(10),
      admin.from('loan_repayments').select('amount, status').eq('loan_id', id),
      getInterestSettings(),
      getPrivateFileUrl(loan.support_document_url),
    ])

  const currency = normalizeCurrency(loan.currency) as CurrencyCode
  const member = Array.isArray(loan.members) ? loan.members[0] : loan.members
  const referee = Array.isArray(loan.referee) ? loan.referee[0] : loan.referee
  const approver = Array.isArray(loan.approver) ? loan.approver[0] : loan.approver
  const refereeNameKh =
    'referee_name_kh' in loan && typeof loan.referee_name_kh === 'string'
      ? loan.referee_name_kh
      : null
  const refereeNameEn =
    'referee_name_en' in loan && typeof loan.referee_name_en === 'string'
      ? loan.referee_name_en
      : 'referee_name' in loan && typeof loan.referee_name === 'string'
        ? loan.referee_name
        : null
  const refereePhone =
    'referee_phone' in loan && typeof loan.referee_phone === 'string' ? loan.referee_phone : null
  const refereeEmail =
    'referee_email' in loan && typeof loan.referee_email === 'string' ? loan.referee_email : null
  const hasRefereeInfo = Boolean(referee || refereeNameKh || refereeNameEn)

  const docChecklist = [
    {
      label: 'អ្នកធានា',
      done: hasRefereeInfo,
      detail: hasRefereeInfo ? 'បានផ្តល់ព័ត៌មាន' : 'មិនបានដាក់',
    },
    {
      label: 'ច្បាប់ដើម',
      done: Boolean(loan.hard_copy_submitted),
      detail: loan.hard_copy_submitted ? 'បានទទួល' : 'រង់ចាំ (បន្ទាប់ពីទទួលយក)',
    },
    {
      label: 'ការផ្តិតមេដៃ',
      done: Boolean(loan.thumbprint_submitted),
      detail: loan.thumbprint_submitted ? 'បានទទួល' : 'រង់ចាំ (បន្ទាប់ពីដំណើរការ)',
    },
    ...(loan.support_document_url
      ? [
          {
            label: 'ឯកសារគាំទ្រ',
            done: true,
            detail: 'បានផ្ទុក',
            href: supportDocumentUrl,
          },
        ]
      : []),
  ]

  const docsComplete = docChecklist.every((item) => item.done)

  const loanPrincipal = Number(loan.amount ?? 0)
  const loanTerm = loan.term_months ?? 1
  const loanRate = resolveLoanInterestRate(loan, interestSettings.monthlyLoanInterestRate)
  const totalPaid = (allRepayments ?? [])
    .filter((repayment) => repayment.status === 'verified' || repayment.status === 'completed')
    .reduce((sum, repayment) => sum + Number(repayment.amount ?? 0), 0)
  const scheduleStart =
    loan.disbursed_at?.slice(0, 10) ?? loan.start_date ?? loan.created_at?.slice(0, 10) ?? null
  const paymentSchedule =
    loanTerm > 0 && loanPrincipal > 0
      ? annotateLoanPaymentSchedule(
          buildLoanPaymentSchedule(loanPrincipal, loanTerm, loanRate, scheduleStart),
          totalPaid
        )
      : []
  return (
    <LoanDetailView
      loan={loan}
      currency={currency}
      member={member}
      referee={referee}
      approver={approver}
      refereeNameKh={refereeNameKh}
      refereeNameEn={refereeNameEn}
      refereePhone={refereePhone}
      refereeEmail={refereeEmail}
      hasRefereeInfo={hasRefereeInfo}
      docChecklist={docChecklist}
      docsComplete={docsComplete}
      loanRate={loanRate}
      paymentSchedule={paymentSchedule}
      repayments={repayments ?? []}
    />
  )
}
