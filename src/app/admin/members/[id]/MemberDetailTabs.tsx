'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  Briefcase,
  Calendar,
  Scale,
  CircleAlert,
  CreditCard,
  ExternalLink,
  FileText,
  Mail,
  MapPin,
  Percent,
  Phone,
  PiggyBank,
  Shield,
  ShieldCheck,
  Wallet,
  User,
  UserCheck,
} from 'lucide-react'
import { LoanStatusBadge, MemberStatusBadge, SavingStatusBadge, MEMBER_ROLE_LABELS } from '@/components/ui/Badge'
import { formatDate, money } from '@/app/admin/adminUtils'
import { normalizeCurrency } from '@/lib/currency'
import { monthlySavingInterest } from '@/lib/interestCalculations'
import type { LoanStatus, MemberRole, MemberStatus, SavingStatus } from '@/types/database'
import { WORKPLACE_LABELS } from '@/lib/workplace'
import { MemberProfileEditForm } from './MemberProfileEditForm'
import { MemberDocumentsEditForm } from './MemberDocumentsEditForm'
import { MemberRefereeEditForm } from './MemberRefereeEditForm'
import { MemberLoanInterestForm } from './MemberLoanInterestForm'
import { MemberAddSavingForm } from './MemberAddSavingForm'
import { MemberAddCapitalRequestForm } from './MemberAddCapitalRequestForm'
import { MemberAddLoanForm } from './MemberAddLoanForm'
import { useMemberEditMode } from './MemberEditModeContext'
import type { LoanInterestPlan } from '@/lib/loanInterestPlans'
import type { CurrencyCode } from '@/lib/currency'
import type { LoanEligibility } from '@/lib/loanEligibility'

export type TabId = 'profile' | 'finance' | 'documents' | 'referee' | 'savings' | 'loans'

type EmergencyContact = { full_name: string; phone: string }

type RefereeRecord = {
  id: string
  full_name: string
  full_name_kh?: string | null
  full_name_en?: string | null
  email: string
  phone?: string | null
  status: MemberStatus
}

type SavingRow = {
  id: string
  amount: number | null
  currency?: string | null
  status: string
  saving_date: string | null
  created_at: string
}

type LoanRow = {
  id: string
  amount: number | null
  currency?: string | null
  purpose: string | null
  status: string
  term_months: number | null
  created_at: string
}

export type MemberDetailTabsProps = {
  member: {
    id: string
    full_name: string
    full_name_kh: string | null
    full_name_en: string | null
    email: string
    phone: string | null
    date_of_birth: string | null
    address: string | null
    status: MemberStatus
    role: MemberRole
    id_number: string | null
    resident_book_number: string | null
    workplace: string | null
    id_document_url: string | null
    resident_book_url: string | null
    referee_id: string | null
    referee_verified: boolean
    telegram_chat_id: string | null
    emergency_contacts: EmergencyContact[]
  }
  referee: RefereeRecord | null
  savings: SavingRow[]
  loans: LoanRow[]
  savingsTotal: number
  loanTotal: number
  savingsCount: number
  loansCount: number
  idDocumentUrl: string | null
  residentBookUrl: string | null
  docsComplete: boolean
  loanInterest?: {
    assignedPlanId: string | null
    plans: LoanInterestPlan[]
    globalMonthlyLoanInterestRate: number
  }
  savingInterest?: {
    monthlyRate: number
    monthlyAmount: number
    accruedTotal: number
    nextDate: string | null
  }
  memberCurrency: CurrencyCode
  monthlyLoanInterestRate: number
  loanEligibility: LoanEligibility
  defaultTab?: TabId
}

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'profile', label: 'ព័ត៌មាន', icon: <User className="h-4 w-4" /> },
  { id: 'finance', label: 'សង្ខេបហិរញ្ញវត្ថុ', icon: <Wallet className="h-4 w-4" /> },
  { id: 'documents', label: 'ឯកសារ', icon: <ShieldCheck className="h-4 w-4" /> },
  { id: 'referee', label: 'អ្នកធានា', icon: <UserCheck className="h-4 w-4" /> },
  { id: 'savings', label: 'សន្សំ', icon: <PiggyBank className="h-4 w-4" /> },
  { id: 'loans', label: 'កម្ជី', icon: <CreditCard className="h-4 w-4" /> },
]

function isVerifiedSavingStatus(status: string) {
  return status === 'verified' || status === 'completed'
}

export function MemberDetailTabs({
  member,
  referee,
  savings,
  loans,
  savingsTotal,
  loanTotal,
  savingsCount,
  loansCount,
  idDocumentUrl,
  residentBookUrl,
  docsComplete,
  loanInterest,
  savingInterest,
  memberCurrency,
  monthlyLoanInterestRate,
  loanEligibility,
  defaultTab = 'profile',
}: MemberDetailTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>(defaultTab)
  const { isEditing, exitEditMode } = useMemberEditMode()

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <nav
        className="shrink-0 w-full overflow-x-auto rounded-t-2xl border border-b-0 border-border bg-surface shadow-sm"
        aria-label="ផ្ទាំងព័ត៌មានសមាជិក"
      >
        <div className="flex w-full min-w-max sm:min-w-0">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-1 items-center justify-center gap-2 border-b-2 px-3 py-4 text-sm font-semibold transition sm:px-5 ${
                  isActive
                    ? 'border-brand-900 text-brand-900'
                    : 'border-transparent text-muted hover:border-border hover:bg-surface-muted hover:text-foreground'
                }`}
              >
                <span className={isActive ? 'text-brand-900' : 'text-muted'}>{tab.icon}</span>
                {tab.label}
              </button>
            )
          })}
        </div>
      </nav>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-b-2xl border border-border bg-surface shadow-sm">
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-6 md:p-8">
        {activeTab === 'profile' && (
          <div className="w-full space-y-8">
            <div>
              <div className="mt-6">
                {isEditing ? (
                  <MemberProfileEditForm member={member} onSaved={exitEditMode} />
                ) : (
                  <>
                    <div className="grid w-full gap-4 sm:grid-cols-2 xl:grid-cols-3">
                      <InfoTile
                        icon={<User className="h-4 w-4" />}
                        label="ឈ្មោះ (ខ្មែរ)"
                        value={member.full_name_kh ?? member.full_name}
                      />
                      <InfoTile
                        icon={<User className="h-4 w-4" />}
                        label="ឈ្មោះ (អង់គ្លេស)"
                        value={member.full_name_en ?? member.full_name}
                      />
                      <InfoTile
                        icon={<Shield className="h-4 w-4" />}
                        label="តួនាទី"
                        value={MEMBER_ROLE_LABELS[member.role]}
                      />
                      <InfoTile icon={<Mail className="h-4 w-4" />} label="អ៊ីមែល" value={member.email} />
                      <InfoTile
                        icon={<Phone className="h-4 w-4" />}
                        label="ទូរស័ព្ទ"
                        value={member.phone ?? 'គ្មាន'}
                      />
                      <InfoTile
                        icon={<Calendar className="h-4 w-4" />}
                        label="ថ្ងៃខែឆ្នាំកំណើត"
                        value={formatDate(member.date_of_birth)}
                      />
                      <InfoTile
                        icon={<CreditCard className="h-4 w-4" />}
                        label="លេខអត្តសញ្ញាណប័ណ្ណ"
                        value={member.id_number ?? 'គ្មាន'}
                      />
                      <InfoTile
                        icon={<FileText className="h-4 w-4" />}
                        label="លេខសៀវភៅគ្រួសារ"
                        value={member.resident_book_number ?? 'គ្មាន'}
                      />
                      <InfoTile
                        icon={<Briefcase className="h-4 w-4" />}
                        label="កន្លែងធ្វើការ"
                        value={member.workplace ? (WORKPLACE_LABELS[member.workplace as keyof typeof WORKPLACE_LABELS] ?? member.workplace) : 'គ្មាន'}
                      />
                      <InfoTile
                        icon={<Calendar className="h-4 w-4" />}
                        label="Telegram"
                        value={member.telegram_chat_id ?? 'មិនបានភ្ជាប់'}
                      />
                      <InfoTile
                        icon={<MapPin className="h-4 w-4" />}
                        label="អាសយដ្ឋាន"
                        value={member.address ?? 'គ្មាន'}
                        className="sm:col-span-2 xl:col-span-3"
                      />
                    </div>
                    {member.emergency_contacts.length > 0 && (
                      <div className="mt-6 border-t border-border pt-6">
                        <h4 className="mb-3 text-sm font-semibold text-foreground">ទំនាក់ទំនងបន្ទាន់</h4>
                        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                          {member.emergency_contacts.map((contact, index) => (
                            <div
                              key={`${contact.full_name}-${contact.phone}-${index}`}
                              className="rounded-xl border border-border bg-surface-muted/40 p-4"
                            >
                              <p className="text-sm font-medium text-foreground">{contact.full_name}</p>
                              <p className="mt-1 text-sm text-muted">{contact.phone}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'finance' && (
          <FinancialSummary
            savingsAmount={savingsTotal}
            loanAmount={loanTotal}
            savingsCount={savingsCount}
            loansCount={loansCount}
            savingInterest={savingInterest}
            onViewSavings={() => setActiveTab('savings')}
            onViewLoans={() => setActiveTab('loans')}
          />
        )}

        {activeTab === 'documents' && (
          <div className="w-full space-y-6">
            {isEditing && <MemberDocumentsEditForm memberId={member.id} onSaved={exitEditMode} />}
            <div className="w-full">       
              <div className="grid w-full gap-6 xl:grid-cols-2">
                <DocumentPreview
                  label="អត្តសញ្ញាណប័ណ្ណ"
                  storageKey={member.id_document_url}
                  url={idDocumentUrl}
                />
                <DocumentPreview
                  label="សៀវភៅគ្រួសារ"
                  storageKey={member.resident_book_url}
                  url={residentBookUrl}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'referee' && (
          <div className="w-full">
            <SectionTitle icon={<UserCheck className="h-5 w-5" />} title="អ្នកធានា" />
            {isEditing && (
              <div className="mt-5">
                <MemberRefereeEditForm
                  memberId={member.id}
                  refereeId={member.referee_id}
                  refereeDisplayName={
                    referee?.full_name ??
                    referee?.full_name_kh ??
                    referee?.full_name_en ??
                    ''
                  }
                  refereeVerified={member.referee_verified}
                  onSaved={exitEditMode}
                />
              </div>
            )}
            {referee ? (
              <div className="mt-5 rounded-xl border border-gray-100 bg-gray-50 p-4">
                <div className="flex items-start gap-3">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-brand-100 text-sm font-bold text-brand-900">
                    {referee.full_name
                      .split(' ')
                      .map((p) => p[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-900">{referee.full_name}</p>
                    <p className="truncate text-sm text-gray-500">{referee.email}</p>
                    <p className="text-sm text-gray-500">{referee.phone ?? 'គ្មានទូរស័ព្ទ'}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <MemberStatusBadge status={referee.status} />
                      <span
                        className={`rounded-md px-2 py-0.5 text-xs font-semibold ${
                          member.referee_verified
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {member.referee_verified ? 'បានបញ្ជាក់' : 'រង់ចាំ'}
                      </span>
                    </div>
                  </div>
                </div>
                <Link
                  href={`/admin/members/${referee.id}`}
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-white py-2.5 text-sm font-semibold text-brand-700 ring-1 ring-gray-200 transition hover:bg-brand-50"
                >
                  មើលប្រវត្តិអ្នកធានា
                  <ExternalLink className="h-4 w-4" />
                </Link>
              </div>
            ) : (
              <div className="mt-5 rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-10 text-center text-sm text-gray-500">
                មិនមានអ្នកធានាត្រូវបានដាក់បញ្ជើទេ។
              </div>
            )}
          </div>
        )}

        {activeTab === 'savings' && (
          <div className="w-full space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-muted">
                {member.status !== 'active'
                  ? 'អ្នកអាចបន្ថែមការសន្សំបានតែសម្រាប់សមាជិកសកម្មប៉ុណ្ណោះ។'
                  : `${savingsCount} ការសន្សំ · សរុប ${money(savingsTotal)}`}
              </p>
              <div className="flex items-center gap-2">
                <MemberAddCapitalRequestForm
                  memberId={member.id}
                  currency={memberCurrency}
                  savingsTotal={savingsTotal}
                  disabled={member.status !== 'active'}
                />
                <MemberAddSavingForm
                  memberId={member.id}
                  currency={memberCurrency}
                  disabled={member.status !== 'active'}
                />
              </div>
            </div>
          <div className="overflow-hidden rounded-xl border border-border bg-surface">
            <div className="overflow-x-auto">
              <table className="w-full min-w-160 text-left text-sm">
                <thead className="border-b border-border bg-surface-muted/80">
                  <tr className="text-xs font-semibold uppercase tracking-wide text-muted">
                    <th className="px-5 py-3.5 md:px-6">ចំនួនទឹកប្រាក់</th>
                    <th className="px-5 py-3.5">
                      ការប្រាក់ប្រចាំខែ
                      {savingInterest ? (
                        <span className="mt-0.5 block text-[10px] font-normal normal-case tracking-normal text-muted">
                          {savingInterest.monthlyRate}% ប្រចាំខែ
                        </span>
                      ) : null}
                    </th>
                    <th className="px-5 py-3.5">ថ្ងៃសន្សំ</th>
                    <th className="px-5 py-3.5">ដាក់ស្នើ</th>
                    <th className="px-5 py-3.5 md:px-6">ស្ថានភាព</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {savings.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-5 py-12 text-center text-sm text-muted md:px-6">
                        មិនមានការសន្សំទេ។
                      </td>
                    </tr>
                  ) : (
                    savings.map((saving) => {
                      const currency = normalizeCurrency(saving.currency)
                      const rowInterest =
                        savingInterest && isVerifiedSavingStatus(saving.status)
                          ? monthlySavingInterest(Number(saving.amount ?? 0), savingInterest.monthlyRate)
                          : null

                      return (
                        <tr key={saving.id} className="transition hover:bg-surface-muted/50">
                          <td className="px-5 py-4 md:px-6">
                            <p className="font-bold tabular-nums text-foreground">
                              {money(saving.amount, currency)}
                            </p>
                          </td>
                          <td className="px-5 py-4">
                            {rowInterest !== null ? (
                              <p className="font-semibold tabular-nums text-emerald-700">
                                {money(rowInterest, currency)}
                              </p>
                            ) : (
                              <span className="text-muted">—</span>
                            )}
                          </td>
                          <td className="px-5 py-4 text-foreground">
                            {formatDate(saving.saving_date)}
                          </td>
                          <td className="px-5 py-4 text-muted">{formatDate(saving.created_at)}</td>
                          <td className="px-5 py-4 md:px-6">
                            <SavingStatusBadge status={saving.status as SavingStatus} plain />
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
                {savingInterest && savings.length > 0 && (
                  <tfoot className="border-t-2 border-border bg-surface-muted/60">
                    <tr>
                      <td className="px-5 py-4 md:px-6">
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted">សរុប</p>
                        <p className="mt-1 font-bold tabular-nums text-foreground">{money(savingsTotal)}</p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                          សរុបការប្រាក់
                        </p>
                        <p className="mt-1 font-bold tabular-nums text-emerald-700">
                          {money(savingInterest.monthlyAmount)}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                          ថ្ងៃទទួលការប្រាក់បន្ទាប់
                        </p>
                        <p className="mt-1 text-sm font-semibold text-foreground">
                          {savingInterest.nextDate ? formatDate(savingInterest.nextDate) : '—'}
                        </p>
                      </td>
                      <td colSpan={2} className="px-5 py-4 text-sm text-muted md:px-6">
                        {savingsCount} ការសន្សំបានទទួល
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
          </div>
        )}

        {activeTab === 'loans' && (
          <div className="w-full space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-muted">
                {member.status !== 'active'
                  ? 'អ្នកអាចបន្ថែមកម្ជីបានតែសម្រាប់សមាជិកសកម្មប៉ុណ្ណោះ។'
                  : `${loansCount} កម្ជីសកម្ម · សរុប ${money(loanTotal)}`}
              </p>
              <MemberAddLoanForm
                memberId={member.id}
                currency={memberCurrency}
                monthlyLoanInterestRate={monthlyLoanInterestRate}
                eligibility={loanEligibility}
                referee={
                  referee
                    ? {
                        id: referee.id,
                        nameKh: referee.full_name_kh ?? referee.full_name,
                        nameEn: referee.full_name_en ?? referee.full_name,
                        phone: referee.phone ?? '',
                        email: referee.email,
                      }
                    : null
                }
                disabled={member.status !== 'active'}
              />
            </div>
            {isEditing && loanInterest && (
              <MemberLoanInterestForm
                memberId={member.id}
                assignedPlanId={loanInterest.assignedPlanId}
                plans={loanInterest.plans}
                globalMonthlyLoanInterestRate={loanInterest.globalMonthlyLoanInterestRate}
                onSaved={exitEditMode}
              />
            )}
            <div className="w-full overflow-hidden rounded-xl border border-border bg-surface">
            <div className="overflow-x-auto">
              <table className="w-full min-w-3xl text-left text-sm">
                <thead className="border-b border-border bg-surface-muted/80">
                  <tr className="text-xs font-semibold uppercase tracking-wide text-muted">
                    <th className="px-5 py-3.5 md:px-6">ចំនួនទឹកប្រាក់</th>
                    <th className="px-5 py-3.5">គោលបំណង</th>
                    <th className="px-5 py-3.5">រយៈពេល</th>
                    <th className="px-5 py-3.5">ដាក់ស្នើ</th>
                    <th className="px-5 py-3.5">ស្ថានភាព</th>
                    <th className="w-12 px-5 py-3.5 md:px-6" aria-label="មើលលម្អិត" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {loans.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-12 text-center text-sm text-muted md:px-6">
                        មិនមានកម្ជីទេ។
                      </td>
                    </tr>
                  ) : (
                    loans.map((loan) => (
                      <tr key={loan.id} className="transition hover:bg-surface-muted/50">
                        <td className="px-5 py-4 md:px-6">
                          <p className="font-bold tabular-nums text-foreground">
                            {money(loan.amount, normalizeCurrency(loan.currency))}
                          </p>
                        </td>
                        <td className="max-w-56 px-5 py-4 text-foreground">
                          <p className="line-clamp-2">{loan.purpose ?? 'គ្មានគោលបំណង'}</p>
                        </td>
                        <td className="px-5 py-4 text-foreground">
                          {loan.term_months ?? 0} ខែ
                        </td>
                        <td className="px-5 py-4 text-muted">{formatDate(loan.created_at)}</td>
                        <td className="px-5 py-4">
                          <LoanStatusBadge status={loan.status as LoanStatus} />
                        </td>
                        <td className="px-5 py-4 text-right md:px-6">
                          <Link
                            href={`/admin/loans/${loan.id}`}
                            className="inline-flex items-center justify-center rounded-lg p-2 text-muted transition hover:bg-brand-50 hover:text-brand-700"
                            aria-label="មើលលម្អិត"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          </div>
        )}

        </div>
      </div>
    </div>
  )
}

function FinancialSummary({
  savingsAmount,
  loanAmount,
  savingsCount,
  loansCount,
  savingInterest,
  onViewSavings,
  onViewLoans,
}: {
  savingsAmount: number
  loanAmount: number
  savingsCount: number
  loansCount: number
  savingInterest?: {
    monthlyRate: number
    monthlyAmount: number
    accruedTotal: number
    nextDate: string | null
  }
  onViewSavings: () => void
  onViewLoans: () => void
}) {
  return (
    <div className="w-full space-y-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-800 ring-1 ring-brand-100">
              <Wallet className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-foreground">សង្ខេបហិរញ្ញវត្ថុ</h2>
              <p className="text-sm text-muted">ទិដ្ឋភាពរួមនៃសន្សំ ការប្រាក់ និងកម្ជីសកម្ម</p>
            </div>
          </div>
        </div>
      </div>

      <section>
        <h3 className="mb-4 text-xs font-semibold uppercase tracking-wide text-muted">សង្ខេប</h3>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <FinancialStatCard
            label="សន្សំសរុប"
            amount={savingsAmount}
            meta={`${savingsCount} ការសន្សំបានទទួល`}
            icon={PiggyBank}
            tone="emerald"
            actionLabel="មើលបញ្ជីសន្សំ"
            onAction={onViewSavings}
          />
          {savingInterest && (
            <FinancialStatCard
              label="ការប្រាក់សន្សំប្រចាំខែ"
              amount={savingInterest.monthlyAmount}
              meta={`${savingInterest.monthlyRate}% នៃសន្សំសរុប`}
              icon={Percent}
              tone="amber"
            />
          )}
          <FinancialStatCard
            label="កម្ជីសកម្ម"
            amount={loanAmount}
            meta={`${loansCount} កម្ជីកំពុងដំណើរការ`}
            icon={CreditCard}
            tone="blue"
            actionLabel="មើលបញ្ជីកម្ជី"
            onAction={onViewLoans}
          />
          <FinancialStatCard
            label="សមតុល្យសរុប"
            amount={savingsAmount + (savingInterest?.accruedTotal ?? 0) - loanAmount}
            meta="សន្សំ + ការប្រាក់ − កម្ជីសកម្ម"
            icon={Scale}
            tone="violet"
          />
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
        <div className="border-b border-border bg-surface-muted/50 px-5 py-4 md:px-6">
          <h3 className="text-sm font-semibold text-foreground">ព័ត៌មានលម្អិត</h3>
          <p className="mt-0.5 text-xs text-muted">ចំនួន និងអត្រាការប្រាក់ដែលពាក់ព័ន្ធ</p>
        </div>
        <dl className="divide-y divide-border">
          <FinancialDetailRow
            icon={PiggyBank}
            label="ការសន្សំបានទទួល"
            value={`${savingsCount} ដង`}
            tone="emerald"
          />
          <FinancialDetailRow
            icon={CreditCard}
            label="កម្ជីកំពុងដំណើរការ"
            value={`${loansCount} កម្ជី`}
            tone="blue"
          />
          {savingInterest && (
            <FinancialDetailRow
              icon={Percent}
              label="អត្រាការប្រាក់សន្សំ"
              value={`${savingInterest.monthlyRate}% ប្រចាំខែ`}
              tone="amber"
            />
          )}
          <FinancialDetailRow
            icon={Scale}
            label="សមតុល្យសរុប"
            value={money(savingsAmount + (savingInterest?.accruedTotal ?? 0) - loanAmount)}
            tone="violet"
            highlight
          />
        </dl>
      </section>
    </div>
  )
}

function FinancialStatCard({
  label,
  amount,
  meta,
  icon: Icon,
  tone,
  actionLabel,
  onAction,
}: {
  label: string
  amount: number
  meta: string
  icon: React.ComponentType<{ className?: string }>
  tone: 'emerald' | 'blue' | 'amber' | 'violet'
  actionLabel?: string
  onAction?: () => void
}) {
  const styles =
    tone === 'emerald'
      ? {
          card: 'hover:border-emerald-200 hover:shadow-emerald-100/50',
          stripe: 'bg-emerald-500',
          icon: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
          badge: 'bg-emerald-50 text-emerald-800',
        }
      : tone === 'amber'
        ? {
            card: 'hover:border-amber-200 hover:shadow-amber-100/50',
            stripe: 'bg-amber-500',
            icon: 'bg-amber-50 text-amber-700 ring-amber-100',
            badge: 'bg-amber-50 text-amber-800',
          }
        : tone === 'violet'
          ? {
              card: 'hover:border-violet-200 hover:shadow-violet-100/50',
              stripe: 'bg-violet-500',
              icon: 'bg-violet-50 text-violet-700 ring-violet-100',
              badge: 'bg-violet-50 text-violet-800',
            }
          : {
              card: 'hover:border-brand-200 hover:shadow-brand-100/50',
              stripe: 'bg-brand-600',
              icon: 'bg-brand-50 text-brand-700 ring-brand-100',
              badge: 'bg-brand-50 text-brand-800',
            }

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border border-border bg-surface p-5 shadow-sm transition hover:shadow-md ${styles.card}`}
    >
      <div className={`absolute inset-x-0 top-0 h-1 ${styles.stripe}`} aria-hidden />
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1 pt-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
          <p className="mt-3 text-2xl font-bold tabular-nums tracking-tight text-foreground">
            {money(amount)}
          </p>
          <span
            className={`mt-3 inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${styles.badge}`}
          >
            {meta}
          </span>
        </div>
        <span
          className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ring-1 ${styles.icon}`}
        >
          <Icon className="h-5 w-5" />
        </span>
      </div>
      {actionLabel && onAction ? (
        <button
          type="button"
          onClick={onAction}
          className="mt-5 inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-border bg-surface-muted/50 px-3 py-2 text-xs font-semibold text-brand-800 transition hover:border-brand-200 hover:bg-brand-50 group-hover:border-brand-200"
        >
          {actionLabel}
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      ) : null}
    </div>
  )
}

function FinancialDetailRow({
  icon: Icon,
  label,
  value,
  tone,
  highlight = false,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  tone: 'emerald' | 'blue' | 'amber' | 'violet'
  highlight?: boolean
}) {
  const iconTone =
    tone === 'emerald'
      ? 'bg-emerald-50 text-emerald-700'
      : tone === 'amber'
        ? 'bg-amber-50 text-amber-700'
        : tone === 'violet'
          ? 'bg-violet-50 text-violet-700'
          : 'bg-brand-50 text-brand-700'

  return (
    <div
      className={`flex items-center justify-between gap-4 px-5 py-4 md:px-6 ${
        highlight ? 'bg-surface-muted/40' : ''
      }`}
    >
      <dt className="flex min-w-0 items-center gap-3 text-sm text-muted">
        <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${iconTone}`}>
          <Icon className="h-4 w-4" />
        </span>
        {label}
      </dt>
      <dd
        className={`shrink-0 text-sm font-semibold tabular-nums ${
          highlight ? 'text-base text-foreground' : 'text-foreground'
        }`}
      >
        {value}
      </dd>
    </div>
  )
}

function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <h3 className="flex items-center gap-2 text-lg font-semibold text-foreground">
      <span className="text-brand-700">{icon}</span>
      {title}
    </h3>
  )
}

function InfoTile({
  icon,
  label,
  value,
  className = '',
}: {
  icon: React.ReactNode
  label: string
  value: string
  className?: string
}) {
  return (
    <div
      className={`rounded-xl border border-border bg-surface-muted/80 p-4 transition hover:border-border hover:bg-surface-muted ${className}`}
    >
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted">
        <span className="text-brand-600/70">{icon}</span>
        {label}
      </div>
      <p className="mt-2 text-sm font-medium text-foreground wrap-break-word">{value}</p>
    </div>
  )
}

function DocumentPreview({
  label,
  storageKey,
  url,
}: {
  label: string
  storageKey: string | null | undefined
  url: string | null
}) {
  if (!storageKey) {
    return (
      <div className="flex min-h-80 flex-col overflow-hidden rounded-xl border border-dashed border-gray-200 bg-gray-50">
        <DocHeader label={label} />
        <div className="flex flex-1 flex-col items-center justify-center gap-2 px-4 py-12 text-center">
          <CircleAlert className="h-8 w-8 text-gray-300" />
          <p className="text-sm font-medium text-gray-500">មិនបានផ្ទុក</p>
        </div>
      </div>
    )
  }

  if (!url) {
    return (
      <div className="flex min-h-80 flex-col overflow-hidden rounded-xl border border-amber-200 bg-amber-50">
        <DocHeader label={label} warning />
        <div className="flex flex-1 items-center justify-center px-4 py-12 text-sm text-amber-800">
          បានផ្ទុក ប៉ុន្តែមិនអាចបង្ហាញឯកសារបានទេ
        </div>
      </div>
    )
  }

  const isPdf = /\.pdf$/i.test(storageKey)

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xs">
      <DocHeader label={label} url={url} />
      <div className="bg-slate-100 p-3">
        {isPdf ? (
          <iframe
            src={url}
            title={label}
            className="h-[min(72vh,560px)] w-full rounded-lg border border-gray-200 bg-white"
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={url}
            alt={label}
            className="mx-auto block max-h-[min(72vh,560px)] w-full rounded-lg border border-gray-200 bg-white object-contain"
          />
        )}
      </div>
    </div>
  )
}

function DocHeader({
  label,
  url,
  warning,
}: {
  label: string
  url?: string
  warning?: boolean
}) {
  return (
    <div
      className={`flex items-center justify-between gap-3 border-b px-4 py-3 ${
        warning ? 'border-amber-200 bg-amber-50' : 'border-gray-100 bg-gray-50'
      }`}
    >
      <p className={`text-sm font-semibold ${warning ? 'text-amber-950' : 'text-gray-900'}`}>{label}</p>
      {url && (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1.5 text-xs font-semibold text-brand-700 ring-1 ring-gray-200 transition hover:bg-brand-50"
        >
          បើកផ្ទាំងថ្មី
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      )}
    </div>
  )
}
