'use client'

import { useState, useTransition, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowRight,
  Scale,
  CircleAlert,
  CreditCard,
  ExternalLink,
  X,
  Percent,
  Phone,
  PiggyBank,
  Plus,
  ShieldCheck,
  Trash2,
  Wallet,
  User,
  UserCheck,
} from 'lucide-react'
import { LoanStatusBadge, MemberStatusBadge, SavingStatusBadge, MEMBER_ROLE_LABELS } from '@/components/ui/Badge'
import { formatDate, money } from '@/app/admin/adminUtils'
import { memberKhmerName } from '@/lib/memberNames'
import { AdminMemberTelegramLink } from '@/components/telegram/AdminMemberTelegramLink'
import { normalizeCurrency } from '@/lib/currency'
import { monthlySavingInterest } from '@/lib/interestCalculations'
import type { LoanStatus, MemberRole, MemberStatus, SavingStatus } from '@/types/database'
import { WORKPLACE_LABELS, WORKPLACE_OPTIONS } from '@/lib/workplace'
import { adminFieldClassName } from '@/components/admin'
import { updateMemberProfile } from '@/app/actions/admin'
import { showError, showSuccess } from '@/lib/toast'
import { useRegisterMemberEditForm } from './MemberEditModeContext'
import { CambodiaAddressSelect, formatCambodiaAddress, parseCambodiaAddress } from '@/components/ui/CambodiaAddressSelect'

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
    telegram_chat_id: string | null
    emergency_contacts: EmergencyContact[]
  }
  referee: RefereeRecord | null
  savings: SavingRow[]
  loans: LoanRow[]
  savingsTotal: number
  loanTotal: number
  loanRemainingBalance: number
  savingsCount: number
  loansCount: number
  idDocumentUrl: string | null
  residentBookUrl: string | null
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
  telegramConnectToken?: string | null
  telegramLinked?: boolean
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
  loanRemainingBalance,
  savingsCount,
  loansCount,
  idDocumentUrl,
  residentBookUrl,
  loanInterest,
  savingInterest,
  memberCurrency,
  monthlyLoanInterestRate,
  loanEligibility,
  defaultTab = 'profile',
  telegramConnectToken = null,
  telegramLinked = false,
}: MemberDetailTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>(defaultTab)
  const { isEditing, exitEditMode } = useMemberEditMode()
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const formRef = useRegisterMemberEditForm(pending)
  const [form, setForm] = useState({
    full_name_kh: member.full_name_kh ?? '',
    full_name_en: member.full_name_en ?? '',
    email: member.email,
    phone: member.phone ?? '',
    date_of_birth: member.date_of_birth ?? '',
    id_number: member.id_number ?? '',
    resident_book_number: member.resident_book_number ?? '',
    workplace: member.workplace ?? '',
    address: member.address ?? '',
    role: member.role as string,
  })
  const [emergencyContacts, setEmergencyContacts] = useState<{ full_name: string; phone: string }[]>(
    member.emergency_contacts ?? []
  )

  function handleProfileSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const payload = new FormData()
    payload.set('id', member.id)
    Object.entries(form).forEach(([k, v]) => payload.set(k, v))
    payload.set('emergency_contacts', JSON.stringify(emergencyContacts))
    startTransition(async () => {
      const result = await updateMemberProfile(payload)
      if (!result.success) { showError(result.error ?? 'មិនអាចរក្សាទុកបានទេ។'); return }
      showSuccess('បានរក្សាទុកព័ត៌មានសមាជិក។')
      exitEditMode()
      router.refresh()
    })
  }

  const inputCls = `${adminFieldClassName} px-3 py-1.5 text-sm w-full`

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
                <form ref={formRef} onSubmit={handleProfileSubmit}>
                  <div className="overflow-hidden rounded-xl border border-border">
                    <table className="w-full text-sm">
                      <tbody className="divide-y divide-border">
                        {/* ឈ្មោះ (ខ្មែរ) */}
                        <tr className="bg-surface hover:bg-surface-muted/40">
                          <td className="w-md px-5 py-3 text-sm font-semibold text-muted">ឈ្មោះ (ខ្មែរ)</td>
                          <td className="px-5 py-2">
                            {isEditing ? <input className={inputCls} value={form.full_name_kh} onChange={e => setForm(p => ({ ...p, full_name_kh: e.target.value }))} disabled={pending} /> : <span className="text-sm text-foreground">{memberKhmerName(member)}</span>}
                          </td>
                        </tr>
                        {/* តួនាទី */}
                        <tr className="bg-surface hover:bg-surface-muted/40">
                          <td className="w-md px-5 py-3 text-sm font-semibold text-muted">តួនាទី</td>
                          <td className="px-5 py-2">
                            {isEditing ? (
                              <select className={inputCls} value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))} disabled={pending}>
                                {(['founder', 'comember', 'member'] as MemberRole[]).map(r => <option key={r} value={r}>{MEMBER_ROLE_LABELS[r]}</option>)}
                              </select>
                            ) : <span className="text-sm text-foreground">{MEMBER_ROLE_LABELS[member.role]}</span>}
                          </td>
                        </tr>
                        {/* អ៊ីមែល */}
                        <tr className="bg-surface hover:bg-surface-muted/40">
                          <td className="w-md px-5 py-3 text-sm font-semibold text-muted">អ៊ីមែល</td>
                          <td className="px-5 py-2">
                            {isEditing ? <input type="email" className={inputCls} value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} disabled={pending} /> : <span className="text-sm text-foreground">{member.email}</span>}
                          </td>
                        </tr>
                        {/* ទូរស័ព្ទ */}
                        <tr className="bg-surface hover:bg-surface-muted/40">
                          <td className="w-md px-5 py-3 text-sm font-semibold text-muted">ទូរស័ព្ទ</td>
                          <td className="px-5 py-2">
                            {isEditing ? <input type="tel" className={inputCls} value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} disabled={pending} /> : <span className="text-sm text-foreground">{member.phone ?? 'គ្មាន'}</span>}
                          </td>
                        </tr>
                        {/* ថ្ងៃខែឆ្នាំកំណើត */}
                        <tr className="bg-surface hover:bg-surface-muted/40">
                          <td className="w-md px-5 py-3 text-sm font-semibold text-muted">ថ្ងៃខែឆ្នាំកំណើត</td>
                          <td className="px-5 py-2">
                            {isEditing ? <input type="date" className={inputCls} value={form.date_of_birth} max={new Date().toISOString().slice(0,10)} onChange={e => setForm(p => ({ ...p, date_of_birth: e.target.value }))} disabled={pending} /> : <span className="text-sm text-foreground">{formatDate(member.date_of_birth)}</span>}
                          </td>
                        </tr>
                        {/* លេខអត្តសញ្ញាណប័ណ្ណ */}
                        <tr className="bg-surface hover:bg-surface-muted/40">
                          <td className="w-md px-5 py-3 text-sm font-semibold text-muted">លេខអត្តសញ្ញាណប័ណ្ណ</td>
                          <td className="px-5 py-2">
                            {isEditing ? <input className={inputCls} value={form.id_number} onChange={e => setForm(p => ({ ...p, id_number: e.target.value }))} disabled={pending} /> : <span className="text-sm text-foreground">{member.id_number ?? 'គ្មាន'}</span>}
                          </td>
                        </tr>
                        {/* លេខសៀវភៅគ្រួសារ */}
                        <tr className="bg-surface hover:bg-surface-muted/40">
                          <td className="w-md px-5 py-3 text-sm font-semibold text-muted">លេខសៀវភៅគ្រួសារ</td>
                          <td className="px-5 py-2">
                            {isEditing ? <input className={inputCls} value={form.resident_book_number} onChange={e => setForm(p => ({ ...p, resident_book_number: e.target.value }))} disabled={pending} /> : <span className="text-sm text-foreground">{member.resident_book_number ?? 'គ្មាន'}</span>}
                          </td>
                        </tr>
                        {/* កន្លែងធ្វើការ */}
                        <tr className="bg-surface hover:bg-surface-muted/40">
                          <td className="w-md px-5 py-3 text-sm font-semibold text-muted">កន្លែងធ្វើការ</td>
                          <td className="px-5 py-2">
                            {isEditing ? (
                              <select className={inputCls} value={form.workplace} onChange={e => setForm(p => ({ ...p, workplace: e.target.value }))} disabled={pending}>
                                <option value="">-- ជ្រើសរើស --</option>
                                {WORKPLACE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                              </select>
                            ) : <span className="text-sm text-foreground">{member.workplace ? (WORKPLACE_LABELS[member.workplace as keyof typeof WORKPLACE_LABELS] ?? member.workplace) : 'គ្មាន'}</span>}
                          </td>
                        </tr>
                        {/* Telegram */}
                        <tr className="bg-surface hover:bg-surface-muted/40">
                          <td className="w-md px-5 py-3 text-sm font-semibold text-muted align-top">Telegram</td>
                          <td className="px-5 py-3 text-sm text-foreground">
                            <AdminMemberTelegramLink
                              memberName={memberKhmerName(member)}
                              linked={telegramLinked || Boolean(member.telegram_chat_id)}
                              connectToken={telegramConnectToken}
                            />
                          </td>
                        </tr>
                        {/* អាសយដ្ឋាន */}
                        <tr className="bg-surface hover:bg-surface-muted/40">
                          <td className="w-md px-5 py-3 text-sm font-semibold text-muted align-top pt-4">អាសយដ្ឋាន</td>
                          <td className="px-5 py-2">
                            {isEditing ? (
                              <CambodiaAddressSelect
                                value={parseCambodiaAddress(form.address)}
                                onChange={(addr) => setForm(p => ({ ...p, address: formatCambodiaAddress(addr) }))}
                                disabled={pending}
                                selectClassName={inputCls}
                                inputClassName={inputCls}
                              />
                            ) : (
                              <span className="text-sm text-foreground">{member.address ?? 'គ្មាន'}</span>
                            )}
                          </td>
                        </tr>
                        {/* ព័ត៌មានលម្អិត divider */}
                        <tr className="bg-surface-muted/50">
                          <td colSpan={2} className="px-5 py-2 text-xs font-bold uppercase tracking-wide text-muted">ព័ត៌មានលម្អិត</td>
                        </tr>
                        <tr className="bg-surface hover:bg-surface-muted/40">
                          <td className="w-md px-5 py-3 text-sm font-semibold text-muted">ការសន្សំបានទទួល</td>
                          <td className="px-5 py-3 text-sm text-foreground">{savingsCount} ដង</td>
                        </tr>
                        <tr className="bg-surface hover:bg-surface-muted/40">
                          <td className="w-md px-5 py-3 text-sm font-semibold text-muted">កម្ជីកំពុងដំណើរការ</td>
                          <td className="px-5 py-3 text-sm text-foreground">{loansCount} កម្ជី</td>
                        </tr>
                        {savingInterest && (
                          <tr className="bg-surface hover:bg-surface-muted/40">
                            <td className="w-md px-5 py-3 text-sm font-semibold text-muted">អត្រាការប្រាក់សន្សំ</td>
                            <td className="px-5 py-3 text-sm text-foreground">{savingInterest.monthlyRate}% ប្រចាំខែ</td>
                          </tr>
                        )}
                        <tr className="bg-surface hover:bg-surface-muted/40">
                          <td className="w-md px-5 py-3 text-sm font-semibold text-muted">សមតុល្យសរុប</td>
                          <td className="px-5 py-3 text-sm font-semibold text-foreground">{money(savingsTotal + (savingInterest?.accruedTotal ?? 0) - loanRemainingBalance)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Emergency contacts */}
                  {(isEditing || emergencyContacts.length > 0) && (
                    <div className="mt-6 border-t border-border pt-6">
                      <div className="mb-3 flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-foreground">ទំនាក់ទំនងបន្ទាន់</h4>
                        {isEditing && (
                          <button type="button" onClick={() => setEmergencyContacts(p => [...p, { full_name: '', phone: '' }])} disabled={pending}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface-muted px-3 py-1.5 text-xs font-semibold text-foreground transition hover:bg-brand-50 disabled:opacity-60">
                            <Plus className="h-3.5 w-3.5" /> បន្ថែម
                          </button>
                        )}
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                        {emergencyContacts.map((contact, index) => (
                          <div key={index} className="rounded-xl border border-border bg-surface-muted/40 p-4">
                            {isEditing ? (
                              <>
                                <div className="mb-2 flex items-center justify-between">
                                  <span className="text-xs font-semibold text-muted">ទំនាក់ទំនងលេខ {index + 1}</span>
                                  <button type="button" onClick={() => setEmergencyContacts(p => p.filter((_, i) => i !== index))} disabled={pending}
                                    className="grid h-7 w-7 place-items-center rounded-lg text-muted transition hover:bg-red-50 hover:text-red-600">
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                                <div className="space-y-2">
                                  <div className="relative">
                                    <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                                    <input type="text" placeholder="ឈ្មោះពេញ" value={contact.full_name} onChange={e => setEmergencyContacts(p => p.map((c, i) => i === index ? { ...c, full_name: e.target.value } : c))} className={`${inputCls} pl-9`} disabled={pending} />
                                  </div>
                                  <div className="relative">
                                    <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                                    <input type="tel" placeholder="0812345678" value={contact.phone} onChange={e => setEmergencyContacts(p => p.map((c, i) => i === index ? { ...c, phone: e.target.value } : c))} className={`${inputCls} pl-9`} disabled={pending} />
                                  </div>
                                </div>
                              </>
                            ) : (
                              <>
                                <p className="text-sm font-medium text-foreground">{contact.full_name}</p>
                                <p className="mt-1 text-sm text-muted">{contact.phone}</p>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </form>
              </div>
            </div>

          </div>
        )}

        {activeTab === 'finance' && (
          <FinancialSummary
            savingsAmount={savingsTotal}
            loanAmount={loanTotal}
            loanRemainingBalance={loanRemainingBalance}
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
              <div className="flex w-full flex-col gap-6">
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
          <div className="w-full space-y-4">
            {isEditing && (
              <MemberRefereeEditForm
                memberId={member.id}
                refereeId={member.referee_id}
                refereeDisplayName={
                  referee?.full_name ??
                  referee?.full_name_kh ??
                  referee?.full_name_en ??
                  ''
                }
                onSaved={exitEditMode}
              />
            )}
            <div className="overflow-hidden rounded-xl border border-border bg-surface">
              <div className="overflow-x-auto">
                <table className="w-full min-w-xl text-left text-sm">
                  <thead className="border-b border-border bg-surface-muted/80">
                    <tr className="text-xs font-semibold uppercase tracking-wide text-muted">
                      <th className="px-5 py-3.5 md:px-6">ឈ្មោះ</th>
                      <th className="px-5 py-3.5">ទូរស័ព្ទ</th>
                      <th className="px-5 py-3.5">ស្ថានភាព</th>
                      <th className="w-12 px-5 py-3.5 md:px-6" aria-label="មើលលម្អិត" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {!referee ? (
                      <tr>
                        <td colSpan={4} className="px-5 py-12 text-center text-sm text-muted md:px-6">
                          មិនមានអ្នកធានាត្រូវបានដាក់បញ្ជើទេ។
                        </td>
                      </tr>
                    ) : (
                      <tr className="transition hover:bg-surface-muted/50">
                        <td className="px-5 py-4 md:px-6">
                          <p className="font-semibold text-foreground">
                            {memberKhmerName(referee)}
                          </p>
                        </td>
                        <td className="px-5 py-4 text-foreground">{referee.phone ?? '—'}</td>
                        <td className="px-5 py-4">
                          <MemberStatusBadge status={referee.status} plain />
                        </td>
                        <td className="px-5 py-4 text-right md:px-6">
                          <Link
                            href={`/admin/members/${referee.id}`}
                            className="inline-flex items-center justify-center rounded-lg p-2 text-muted transition hover:bg-brand-50 hover:text-brand-700"
                            aria-label="មើលប្រវត្តិអ្នកធានា"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Link>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
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
                          <LoanStatusBadge status={loan.status as LoanStatus} plain />
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
  loanRemainingBalance,
  savingsCount,
  loansCount,
  savingInterest,
  onViewSavings,
  onViewLoans,
}: {
  savingsAmount: number
  loanAmount: number
  loanRemainingBalance: number
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
  const rows = [
    {
      label: 'សន្សំសរុប',
      value: money(savingsAmount),
      meta: `${savingsCount} ការសន្សំបានទទួល`,
      action: { label: 'មើលបញ្ជីសន្សំ', onClick: onViewSavings },
    },
    ...(savingInterest ? [{
      label: 'ការប្រាក់សន្សំប្រចាំខែ',
      value: money(savingInterest.monthlyAmount),
      meta: `${savingInterest.monthlyRate}% នៃសន្សំសរុប`,
      action: null,
    }] : []),
    {
      label: 'កម្ជីសកម្ម (នៅសល់)',
      value: money(loanRemainingBalance),
      meta: `${loansCount} កម្ជី · ដើម ${money(loanAmount)}`,
      action: { label: 'មើលបញ្ជីកម្ជី', onClick: onViewLoans },
    },
    {
      label: 'សមតុល្យសរុប',
      value: money(savingsAmount + (savingInterest?.accruedTotal ?? 0) - loanRemainingBalance),
      meta: 'សន្សំ + ការប្រាក់ − កម្ជីនៅសល់',
      action: null,
    },
  ]

  return (
    <div className="w-full">
      <div className="overflow-hidden rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-surface-muted/50">
            <tr>
              <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-foreground">ប្រភេទ</th>
              <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-foreground">ចំនួនទឹកប្រាក់</th>
              <th className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-foreground">ព័ត៌មានបន្ថែម</th>
              <th className="px-5 py-3 text-right text-xs font-bold uppercase tracking-wide text-foreground"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((row) => (
              <tr key={row.label} className="bg-surface hover:bg-surface-muted/40">
                <td className="px-5 py-4 text-sm font-semibold text-muted">{row.label}</td>
                <td className="px-5 py-4 text-sm font-bold tabular-nums text-foreground">{row.value}</td>
                <td className="px-5 py-4 text-sm text-muted">{row.meta}</td>
                <td className="px-5 py-4 text-right">
                  {row.action && (
                    <button
                      type="button"
                      onClick={row.action.onClick}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700 hover:text-brand-900"
                    >
                      {row.action.label}
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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
  const [fullscreenOpen, setFullscreenOpen] = useState(false)

  useEffect(() => {
    if (!fullscreenOpen) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setFullscreenOpen(false)
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [fullscreenOpen])

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
    <>
      <div className="overflow-hidden">
        <DocHeader label={label} url={url} />
        <div className="relative">
          {isPdf ? (
            <iframe
              src={url}
              title={label}
              className="h-[min(72vh,560px)] w-full"
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={url}
              alt={label}
              className="mx-auto block max-h-[min(72vh,560px)] w-full object-contain"
            />
          )}
          <button
            type="button"
            onClick={() => setFullscreenOpen(true)}
            className="absolute inset-0 cursor-pointer"
            aria-label={`ពង្រីក ${label}`}
          />
        </div>
      </div>

      {fullscreenOpen ? (
        <div
          className="fixed inset-0 z-[100] flex flex-col bg-black"
          role="dialog"
          aria-modal="true"
          aria-label={label}
        >
          <button
            type="button"
            onClick={() => setFullscreenOpen(false)}
            className="absolute right-4 top-4 z-10 grid h-10 w-10 place-items-center rounded-lg bg-black/60 text-white"
            aria-label="បិទ"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto p-4">
            {isPdf ? (
              <iframe src={url} title={label} className="h-full min-h-[90vh] w-full" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={url} alt={label} className="max-h-full max-w-full object-contain" />
            )}
          </div>
        </div>
      ) : null}
    </>
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
      className={`flex items-center justify-between gap-3 ${
        warning ? 'border-amber-200 bg-amber-50' : 'border-gray-100 bg-gray-50'
      }`}
    />
  )
}

