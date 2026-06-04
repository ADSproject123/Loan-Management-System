'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Calendar,
  CheckCircle2,
  CircleAlert,
  CreditCard,
  ExternalLink,
  FileText,
  Mail,
  MapPin,
  Phone,
  PiggyBank,
  ShieldCheck,
  User,
  UserCheck,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { LoanStatusBadge, MemberStatusBadge, SavingStatusBadge } from '@/components/ui/Badge'
import { formatDate, money } from '@/app/admin/adminUtils'
import { normalizeCurrency, type CurrencyCode } from '@/lib/currency'
import type { AdminCurrencyTotals } from '@/components/admin/types'
import type { LoanStatus, MemberStatus, SavingStatus } from '@/types/database'

export type TabId = 'profile' | 'documents' | 'referee' | 'savings' | 'loans'

type RefereeRecord = {
  id: string
  full_name: string
  email: string
  phone?: string | null
  status: MemberStatus
}

type ChecklistItem = {
  label: string
  done: boolean
  detail: string
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
    id_number: string | null
    resident_book_number: string | null
    id_document_url: string | null
    resident_book_url: string | null
    referee_verified: boolean
    telegram_chat_id: string | null
  }
  referee: RefereeRecord | null
  savings: SavingRow[]
  loans: LoanRow[]
  savingsTotals: AdminCurrencyTotals
  loanTotals: AdminCurrencyTotals
  savingsCountByCurrency: Record<CurrencyCode, number>
  loansCountByCurrency: Record<CurrencyCode, number>
  idDocumentUrl: string | null
  residentBookUrl: string | null
  checklist: ChecklistItem[]
  docsComplete: boolean
  defaultTab?: TabId
}

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'profile', label: 'ព័ត៌មាន', icon: <User className="h-4 w-4" /> },
  { id: 'documents', label: 'ឯកសារ', icon: <ShieldCheck className="h-4 w-4" /> },
  { id: 'referee', label: 'អ្នកបញ្ជាក់', icon: <UserCheck className="h-4 w-4" /> },
  { id: 'savings', label: 'សន្សំ', icon: <PiggyBank className="h-4 w-4" /> },
  { id: 'loans', label: 'កម្ជី', icon: <CreditCard className="h-4 w-4" /> },
]

export function MemberDetailTabs({
  member,
  referee,
  savings,
  loans,
  savingsTotals,
  loanTotals,
  savingsCountByCurrency,
  loansCountByCurrency,
  idDocumentUrl,
  residentBookUrl,
  checklist,
  docsComplete,
  defaultTab = 'profile',
}: MemberDetailTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>(defaultTab)

  return (
    <div className="w-full space-y-0">
      <nav
        className="w-full overflow-x-auto rounded-t-2xl border border-b-0 border-border bg-surface shadow-sm"
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

      <div className="w-full rounded-b-2xl border border-border bg-surface p-6 shadow-sm md:p-8">
        {activeTab === 'profile' && (
          <div className="w-full space-y-8">
            <div>
              <SectionTitle icon={<User className="h-5 w-5" />} title="ព័ត៌មានផ្ទាល់ខ្លួន" />
              <div className="mt-6 grid w-full gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
              <InfoTile icon={<Mail className="h-4 w-4" />} label="អ៊ីមែល" value={member.email} />
              <InfoTile icon={<Phone className="h-4 w-4" />} label="ទូរស័ព្ទ" value={member.phone ?? 'គ្មាន'} />
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
            </div>

            <div>
              <SectionTitle icon={<PiggyBank className="h-5 w-5" />} title="សង្ខេបហិរញ្ញវត្ថុ" />
              <div className="mt-5 space-y-5">
                <CurrencySummaryGroup
                  currency="USD"
                  savingsAmount={savingsTotals.USD}
                  loanAmount={loanTotals.USD}
                  savingsCount={savingsCountByCurrency.USD}
                  loansCount={loansCountByCurrency.USD}
                />
                <CurrencySummaryGroup
                  currency="KHR"
                  savingsAmount={savingsTotals.KHR}
                  loanAmount={loanTotals.KHR}
                  savingsCount={savingsCountByCurrency.KHR}
                  loansCount={loansCountByCurrency.KHR}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'documents' && (
          <div className="w-full space-y-6">
            {member.status === 'pending' && (
              <Card className="w-full rounded-xl border-amber-200 bg-amber-50">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="flex items-center gap-2 font-semibold text-amber-950">
                      <ShieldCheck className="h-5 w-5" />
                      បញ្ជីពិនិត្យមុនអនុម័ត
                    </h3>
                    <p className="mt-1 text-sm text-amber-800">
                      ពិនិត្យឯកសារ និងអ្នកបញ្ជាក់ មុនពេលទទួលយកគណនីសមាជិក។
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {checklist.map((item) => (
                      <span
                        key={item.label}
                        className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold ${
                          item.done
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-white text-amber-800 ring-1 ring-amber-200'
                        }`}
                      >
                        {item.done ? (
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        ) : (
                          <CircleAlert className="h-3.5 w-3.5" />
                        )}
                        {item.label} · {item.detail}
                      </span>
                    ))}
                  </div>
                </div>
              </Card>
            )}

            <div className="w-full">
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-4">
                <SectionTitle icon={<ShieldCheck className="h-5 w-5" />} title="ឯកសារផ្ទៀងផ្ទាត់" />
                <span
                  className={`rounded-lg px-3 py-1 text-xs font-semibold ${
                    docsComplete ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {docsComplete ? 'ឯកសារពេញលេញ' : 'ឯកសារមិនពេញលេញ'}
                </span>
              </div>
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
            <SectionTitle icon={<UserCheck className="h-5 w-5" />} title="អ្នកបញ្ជាក់" />
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
                  មើលប្រវត្តិអ្នកបញ្ជាក់
                  <ExternalLink className="h-4 w-4" />
                </Link>
              </div>
            ) : (
              <div className="mt-5 rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-10 text-center text-sm text-gray-500">
                មិនមានអ្នកបញ្ជាក់ត្រូវបានដាក់បញ្ជើទេ។
              </div>
            )}
          </div>
        )}

        {activeTab === 'savings' && (
          <div className="w-full overflow-hidden rounded-xl border border-border bg-surface">
            <div className="flex items-center gap-2 border-b border-border px-5 py-4 md:px-6">
              <PiggyBank className="h-5 w-5 text-brand-700" />
              <h3 className="text-lg font-semibold text-foreground">ការសន្សំថ្មីៗ</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-138 text-left text-sm">
                <thead className="border-b border-border bg-surface-muted/80">
                  <tr className="text-xs font-semibold uppercase tracking-wide text-muted">
                    <th className="px-5 py-3.5 md:px-6">ចំនួនទឹកប្រាក់</th>
                    <th className="px-5 py-3.5">ថ្ងៃសន្សំ</th>
                    <th className="px-5 py-3.5">ដាក់ស្នើ</th>
                    <th className="px-5 py-3.5 md:px-6">ស្ថានភាព</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {savings.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-5 py-12 text-center text-sm text-muted md:px-6">
                        មិនមានការសន្សំទេ។
                      </td>
                    </tr>
                  ) : (
                    savings.map((saving) => (
                      <tr key={saving.id} className="transition hover:bg-surface-muted/50">
                        <td className="px-5 py-4 md:px-6">
                          <p className="font-bold tabular-nums text-foreground">
                            {money(saving.amount, normalizeCurrency(saving.currency))}
                          </p>
                        </td>
                        <td className="px-5 py-4 text-foreground">
                          {formatDate(saving.saving_date)}
                        </td>
                        <td className="px-5 py-4 text-muted">{formatDate(saving.created_at)}</td>
                        <td className="px-5 py-4 md:px-6">
                          <SavingStatusBadge status={saving.status as SavingStatus} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'loans' && (
          <div className="w-full overflow-hidden rounded-xl border border-border bg-surface">
            <div className="flex items-center gap-2 border-b border-border px-5 py-4 md:px-6">
              <CreditCard className="h-5 w-5 text-brand-700" />
              <h3 className="text-lg font-semibold text-foreground">កម្ជីថ្មីៗ</h3>
            </div>
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
        )}

      </div>
    </div>
  )
}

function CurrencySummaryGroup({
  currency,
  savingsAmount,
  loanAmount,
  savingsCount,
  loansCount,
}: {
  currency: CurrencyCode
  savingsAmount: number
  loanAmount: number
  savingsCount: number
  loansCount: number
}) {
  const isUsd = currency === 'USD'

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface-muted/40">
      <div
        className={`flex items-center justify-between gap-3 border-b border-border px-5 py-3 ${
          isUsd ? 'bg-brand-50' : 'bg-amber-50'
        }`}
      >
        <p className={`text-sm font-semibold ${isUsd ? 'text-brand-900' : 'text-amber-950'}`}>
          {isUsd ? 'រូបិយប័ណ្ណ USD' : 'រូបិយប័ណ្ណ KHR'}
        </p>
        <span
          className={`rounded-md px-2.5 py-1 text-xs font-bold tracking-wide ${
            isUsd ? 'bg-brand-100 text-brand-800' : 'bg-amber-100 text-amber-900'
          }`}
        >
          {currency}
        </span>
      </div>
      <div className="grid gap-px bg-border sm:grid-cols-2">
        <FinancialStatCard
          label="សន្សំសរុប"
          amount={savingsAmount}
          currency={currency}
          subtitle={`${savingsCount} ការសន្សំបានអនុម័ត`}
          icon={PiggyBank}
          tone="emerald"
        />
        <FinancialStatCard
          label="កម្ជីសកម្ម"
          amount={loanAmount}
          currency={currency}
          subtitle={`${loansCount} កម្ជីកំពុងដំណើរការ`}
          icon={CreditCard}
          tone="blue"
        />
      </div>
    </div>
  )
}

function FinancialStatCard({
  label,
  amount,
  currency,
  subtitle,
  icon: Icon,
  tone,
}: {
  label: string
  amount: number
  currency: CurrencyCode
  subtitle: string
  icon: React.ComponentType<{ className?: string }>
  tone: 'emerald' | 'blue'
}) {
  const toneClasses =
    tone === 'emerald'
      ? 'bg-emerald-50/80 text-emerald-900'
      : 'bg-brand-50/80 text-brand-900'
  const iconClasses =
    tone === 'emerald' ? 'bg-emerald-100 text-emerald-700' : 'bg-brand-100 text-brand-700'

  return (
    <div className={`p-5 ${toneClasses}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide opacity-70">{label}</p>
          <p className="mt-3 text-2xl font-bold tabular-nums">{money(amount, currency)}</p>
          <p className="mt-4 text-sm opacity-80">{subtitle}</p>
        </div>
        <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${iconClasses}`}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
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
