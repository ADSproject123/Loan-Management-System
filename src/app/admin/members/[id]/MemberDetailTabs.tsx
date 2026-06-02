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
  status: string
  saving_date: string | null
  created_at: string
}

type LoanRow = {
  id: string
  amount: number | null
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
        className="w-full overflow-x-auto rounded-t-2xl border border-b-0 border-gray-200 bg-white shadow-sm"
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
                    ? 'border-blue-900 text-blue-900'
                    : 'border-transparent text-gray-500 hover:border-gray-200 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <span className={isActive ? 'text-blue-900' : 'text-gray-400'}>{tab.icon}</span>
                {tab.label}
              </button>
            )
          })}
        </div>
      </nav>

      <div className="w-full rounded-b-2xl border border-gray-200 bg-white p-6 shadow-sm md:p-8">
        {activeTab === 'profile' && (
          <div className="w-full">
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
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-blue-100 text-sm font-bold text-blue-900">
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
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-white py-2.5 text-sm font-semibold text-blue-700 ring-1 ring-gray-200 transition hover:bg-blue-50"
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
          <ActivityCard
            title="ការសន្សំថ្មីៗ"
            icon={<PiggyBank className="h-5 w-5 text-blue-700" />}
            empty="មិនមានការសន្សំទេ។"
            isEmpty={savings.length === 0}
          >
            {savings.map((saving) => (
              <li key={saving.id} className="flex items-center justify-between gap-4 px-5 py-4">
                <div>
                  <p className="font-semibold text-gray-900">{money(saving.amount)}</p>
                  <p className="text-sm text-gray-500">
                    {formatDate(saving.saving_date ?? saving.created_at)}
                  </p>
                </div>
                <SavingStatusBadge status={saving.status as SavingStatus} />
              </li>
            ))}
          </ActivityCard>
        )}

        {activeTab === 'loans' && (
          <ActivityCard
            title="កម្ជីថ្មីៗ"
            icon={<CreditCard className="h-5 w-5 text-blue-700" />}
            empty="មិនមានកម្ជីទេ។"
            isEmpty={loans.length === 0}
          >
            {loans.map((loan) => (
              <li key={loan.id}>
                <Link
                  href={`/admin/loans/${loan.id}`}
                  className="flex items-center justify-between gap-4 px-5 py-4 transition hover:bg-gray-50/80"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900">{money(loan.amount)}</p>
                    <p className="truncate text-sm text-gray-500">{loan.purpose ?? 'គ្មានគោលបំណង'}</p>
                    <p className="text-xs text-gray-400">
                      {loan.term_months ?? 0} ខែ · {formatDate(loan.created_at)}
                    </p>
                  </div>
                  <LoanStatusBadge status={loan.status as LoanStatus} />
                </Link>
              </li>
            ))}
          </ActivityCard>
        )}
      </div>
    </div>
  )
}

function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
      <span className="text-blue-700">{icon}</span>
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
      className={`rounded-xl border border-gray-100 bg-gray-50/80 p-4 transition hover:border-gray-200 hover:bg-gray-50 ${className}`}
    >
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
        <span className="text-blue-600/70">{icon}</span>
        {label}
      </div>
      <p className="mt-2 text-sm font-medium text-gray-900 wrap-break-word">{value}</p>
    </div>
  )
}

function ActivityCard({
  title,
  icon,
  empty,
  isEmpty,
  children,
}: {
  title: string
  icon: React.ReactNode
  empty: string
  isEmpty: boolean
  children: React.ReactNode
}) {
  return (
    <div className="w-full overflow-hidden rounded-xl border border-gray-200 bg-gray-50/50">
      <div className="flex items-center gap-2 border-b border-gray-100 bg-white px-5 py-4 md:px-6">
        {icon}
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      </div>
      {isEmpty ? (
        <p className="px-5 py-12 text-center text-sm text-gray-500 md:px-6">{empty}</p>
      ) : (
        <ul className="divide-y divide-gray-100 bg-white">{children}</ul>
      )}
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
          className="inline-flex items-center gap-1.5 rounded-lg bg-white px-2.5 py-1.5 text-xs font-semibold text-blue-700 ring-1 ring-gray-200 transition hover:bg-blue-50"
        >
          បើកផ្ទាំងថ្មី
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      )}
    </div>
  )
}
