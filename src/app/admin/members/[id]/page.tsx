import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  ArrowLeft,
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
import { createAdminClient } from '@/lib/supabase/admin'
import { approveMember, suspendMember } from '@/app/actions/admin'
import { AdminActionButton } from '@/app/admin/AdminActionButton'
import { formatDate, money } from '@/app/admin/adminUtils'
import { getPrivateFileUrl } from '@/lib/uploads'
import type { LoanStatus, MemberStatus, SavingStatus } from '@/types/database'

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
      'id, full_name, email, phone, address, status, id_number, resident_book_number, id_document_url, resident_book_url, referee_id, referee_verified, is_admin, telegram_chat_id, joined_at, created_at, updated_at, referee:referee_id(id, full_name, email, phone, status)'
    )
    .eq('id', id)
    .maybeSingle()

  if (!member) notFound()

  const [{ data: savings }, { data: loans }] = await Promise.all([
    admin
      .from('savings')
      .select('id, amount, status, saving_date, created_at')
      .eq('member_id', id)
      .order('created_at', { ascending: false })
      .limit(5),
    admin
      .from('loans')
      .select('id, amount, purpose, status, term_months, created_at')
      .eq('member_id', id)
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  const [idDocumentUrl, residentBookUrl] = await Promise.all([
    getPrivateFileUrl(member.id_document_url),
    getPrivateFileUrl(member.resident_book_url),
  ])

  const referee = normalizeReferee(member.referee)
  const totalSavings = (savings ?? []).reduce((sum, item) => sum + Number(item.amount ?? 0), 0)
  const activeLoans = (loans ?? []).filter((loan) =>
    ['approved', 'active', 'under_review', 'pending'].includes(loan.status)
  ).length

  const hasIdDoc = Boolean(member.id_document_url)
  const hasResidentBook = Boolean(member.resident_book_url)
  const docsComplete = hasIdDoc && hasResidentBook
  const initials = member.full_name
    .split(' ')
    .map((part: string) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

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
      label: 'អ្នកបញ្ជាក់',
      done: Boolean(referee),
      detail: referee
        ? member.referee_verified
          ? 'បានបញ្ជាក់'
          : 'រង់ចាំការបញ្ជាក់'
        : 'មិនបានដាក់',
    },
  ]

  return (
    <main className="space-y-8 p-6 md:p-8">
      <Link
        href="/admin/members"
        className="inline-flex items-center gap-2 !rounded-none bg-white px-3 py-2 text-sm font-medium text-blue-700 ring-1 ring-gray-200 transition hover:bg-blue-50 hover:text-blue-900"
      >
        <ArrowLeft className="h-4 w-4" />
        ត្រឡប់ទៅបញ្ជីសមាជិក
      </Link>

      <section className="overflow-hidden !rounded-none border border-gray-200 bg-white shadow-sm">
        <div className="bg-blue-900 px-6 py-8 text-white md:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-start gap-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-200">
                  ព័ត៌មានលម្អិតសមាជិក
                </p>
                <h1 className="mt-1 text-2xl font-bold md:text-3xl">{member.full_name}</h1>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <MemberStatusBadge status={member.status as MemberStatus} />
                  {member.is_admin && (
                    <span className="!rounded-none bg-purple-700 px-2.5 py-0.5 text-xs font-semibold text-white">
                      អ្នកគ្រប់គ្រង
                    </span>
                  )}
                  {member.status === 'pending' && (
                    <span className="!rounded-none bg-amber-600 px-2.5 py-0.5 text-xs font-semibold text-white">
                      ត្រូវពិនិត្យ
                    </span>
                  )}
                </div>
                <div className="mt-4 flex flex-wrap gap-3 text-sm text-blue-100">
                  <a
                    href={`mailto:${member.email}`}
                    className="inline-flex items-center gap-2 !rounded-none bg-blue-800 px-3 py-1.5 transition hover:bg-blue-700"
                  >
                    <Mail className="h-4 w-4" />
                    {member.email}
                  </a>
                  {member.phone && (
                    <a
                      href={`tel:${member.phone}`}
                      className="inline-flex items-center gap-2 !rounded-none bg-blue-800 px-3 py-1.5 transition hover:bg-blue-700"
                    >
                      <Phone className="h-4 w-4" />
                      {member.phone}
                    </a>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {member.status !== 'active' && (
                <AdminActionButton action={approveMember} id={member.id}>
                  ទទួលយកសមាជិក
                </AdminActionButton>
              )}
              {member.status !== 'suspended' && (
                <AdminActionButton action={suspendMember} id={member.id} danger>
                  ផ្អាកគណនី
                </AdminActionButton>
              )}
            </div>
          </div>
        </div>

        <div className="grid divide-y divide-gray-100 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          <HeroStat label="សរុបសន្សំ" value={money(totalSavings)} sub={`${(savings ?? []).length} ការដាក់ស្នើថ្មីៗ`} />
          <HeroStat label="ឥណទានសកម្ម" value={String(activeLoans)} sub={`${(loans ?? []).length} ការដាក់ស្នើថ្មីៗ`} />
          <HeroStat
            label="ចុះឈ្មោះ"
            value={formatDate(member.created_at)}
            sub={`ចូលរួម ${formatDate(member.joined_at)}`}
          />
        </div>
      </section>

      {member.status === 'pending' && (
        <Card className="!rounded-none border-amber-200 bg-amber-50">
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
                  className={`inline-flex items-center gap-1.5 !rounded-none px-3 py-1.5 text-xs font-semibold ${
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

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="!rounded-none xl:col-span-2">
          <SectionTitle icon={<User className="h-5 w-5" />} title="ព័ត៌មានផ្ទាល់ខ្លួន" />
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <InfoTile icon={<User className="h-4 w-4" />} label="ឈ្មោះពេញ" value={member.full_name} />
            <InfoTile icon={<Mail className="h-4 w-4" />} label="អ៊ីមែល" value={member.email} />
            <InfoTile icon={<Phone className="h-4 w-4" />} label="ទូរស័ព្ទ" value={member.phone ?? 'គ្មាន'} />
            <InfoTile icon={<CreditCard className="h-4 w-4" />} label="លេខអត្តសញ្ញាណប័ណ្ណ" value={member.id_number ?? 'គ្មាន'} />
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
              className="sm:col-span-2"
            />
          </div>
        </Card>

        <Card className="!rounded-none">
          <SectionTitle icon={<UserCheck className="h-5 w-5" />} title="អ្នកបញ្ជាក់" />
          {referee ? (
            <div className="mt-5 !rounded-none border border-gray-100 bg-gray-50 p-4">
              <div className="flex items-start gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center !rounded-none bg-blue-100 text-sm font-bold text-blue-900">
                  {referee.full_name
                    .split(' ')
                    .map((p: string) => p[0])
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
                      className={`!rounded-none px-2 py-0.5 text-xs font-semibold ${
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
                className="mt-4 inline-flex w-full items-center justify-center gap-2 !rounded-none bg-white py-2.5 text-sm font-semibold text-blue-700 ring-1 ring-gray-200 transition hover:bg-blue-50"
              >
                មើលប្រវត្តិអ្នកបញ្ជាក់
                <ExternalLink className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            <div className="mt-5 !rounded-none border border-dashed border-gray-200 bg-gray-50 px-4 py-10 text-center text-sm text-gray-500">
              មិនមានអ្នកបញ្ជាក់ត្រូវបានដាក់បញ្ជើទេ។
            </div>
          )}
        </Card>
      </div>

      <Card className="!rounded-none">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <SectionTitle icon={<ShieldCheck className="h-5 w-5" />} title="ឯកសារផ្ទៀងផ្ទាត់" />
          <span
            className={`!rounded-none px-3 py-1 text-xs font-semibold ${
              docsComplete
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-amber-100 text-amber-800'
            }`}
          >
            {docsComplete ? 'ឯកសារពេញលេញ' : 'ឯកសារមិនពេញលេញ'}
          </span>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <DocumentPreview label="អត្តសញ្ញាណប័ណ្ណ" storageKey={member.id_document_url} url={idDocumentUrl} />
          <DocumentPreview label="សៀវភៅគ្រួសារ" storageKey={member.resident_book_url} url={residentBookUrl} />
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <ActivityCard
          title="ការសន្សំថ្មីៗ"
          icon={<PiggyBank className="h-5 w-5 text-blue-700" />}
          empty="មិនមានការសន្សំទេ។"
          isEmpty={(savings ?? []).length === 0}
        >
          {(savings ?? []).map((saving) => (
            <li key={saving.id} className="flex items-center justify-between gap-4 px-5 py-4">
              <div>
                <p className="font-semibold text-gray-900">{money(saving.amount)}</p>
                <p className="text-sm text-gray-500">{formatDate(saving.saving_date ?? saving.created_at)}</p>
              </div>
              <SavingStatusBadge status={saving.status as SavingStatus} />
            </li>
          ))}
        </ActivityCard>

        <ActivityCard
          title="ឥណទានថ្មីៗ"
          icon={<CreditCard className="h-5 w-5 text-blue-700" />}
          empty="មិនមានឥណទានទេ។"
          isEmpty={(loans ?? []).length === 0}
        >
          {(loans ?? []).map((loan) => (
            <li key={loan.id} className="flex items-center justify-between gap-4 px-5 py-4">
              <div className="min-w-0">
                <p className="font-semibold text-gray-900">{money(loan.amount)}</p>
                <p className="truncate text-sm text-gray-500">{loan.purpose ?? 'គ្មានគោលបំណង'}</p>
                <p className="text-xs text-gray-400">
                  {loan.term_months ?? 0} ខែ · {formatDate(loan.created_at)}
                </p>
              </div>
              <LoanStatusBadge status={loan.status as LoanStatus} />
            </li>
          ))}
        </ActivityCard>
      </div>
    </main>
  )
}

function normalizeReferee(value: RefereeRecord | RefereeRecord[] | null): RefereeRecord | null {
  if (!value) return null
  return Array.isArray(value) ? (value[0] ?? null) : value
}

function HeroStat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="px-6 py-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-1 text-xl font-bold text-gray-900 md:text-2xl">{value}</p>
      <p className="mt-1 text-sm text-gray-500">{sub}</p>
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
    <div className={`!rounded-none border border-gray-100 bg-gray-50 p-4 ${className}`}>
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
        <span className="text-gray-400">{icon}</span>
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
    <Card padding="none" className="overflow-hidden !rounded-none">
      <div className="flex items-center gap-2 border-b border-gray-100 px-5 py-4">
        {icon}
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      </div>
      {isEmpty ? (
        <p className="px-5 py-10 text-center text-sm text-gray-500">{empty}</p>
      ) : (
        <ul className="divide-y divide-gray-100">{children}</ul>
      )}
    </Card>
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
      <div className="flex min-h-80 flex-col overflow-hidden !rounded-none border border-dashed border-gray-200 bg-gray-50">
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
      <div className="flex min-h-80 flex-col overflow-hidden !rounded-none border border-amber-200 bg-amber-50">
        <DocHeader label={label} warning />
        <div className="flex flex-1 items-center justify-center px-4 py-12 text-sm text-amber-800">
          បានផ្ទុក ប៉ុន្តែមិនអាចបង្ហាញឯកសារបានទេ
        </div>
      </div>
    )
  }

  const isPdf = /\.pdf$/i.test(storageKey)

  return (
    <div className="overflow-hidden !rounded-none border border-gray-200 bg-white shadow-xs">
      <DocHeader label={label} url={url} />
      <div className="bg-slate-100 p-3">
        {isPdf ? (
          <iframe
            src={url}
            title={label}
            className="h-[min(72vh,560px)] w-full !rounded-none border border-gray-200 bg-white"
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={url}
            alt={label}
            className="mx-auto block max-h-[min(72vh,560px)] w-full !rounded-none border border-gray-200 bg-white object-contain"
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
          className="inline-flex items-center gap-1.5 !rounded-none bg-white px-2.5 py-1.5 text-xs font-semibold text-blue-700 ring-1 ring-gray-200 transition hover:bg-blue-50"
        >
          បើកផ្ទាំងថ្មី
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      )}
    </div>
  )
}
