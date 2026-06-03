import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Mail, Phone } from 'lucide-react'
import { MemberStatusBadge } from '@/components/ui/Badge'
import { createAdminClient } from '@/lib/supabase/admin'
import { approveMember } from '@/app/actions/admin'
import { AdminActionButton } from '@/app/admin/AdminActionButton'
import { SuspendMemberButton } from '@/app/admin/SuspendMemberButton'
import { DenyMemberButton } from '@/app/admin/DenyMemberButton'
import { formatDate, money } from '@/app/admin/adminUtils'
import { getPrivateFileUrl } from '@/lib/uploads'
import type { MemberStatus } from '@/types/database'
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
      'id, full_name, full_name_kh, full_name_en, email, phone, date_of_birth, address, status, id_number, resident_book_number, id_document_url, resident_book_url, referee_id, referee_verified, is_admin, telegram_chat_id, suspension_reason, suspended_at, rejection_reason, rejected_at, joined_at, created_at, updated_at, referee:referee_id(id, full_name, full_name_kh, full_name_en, email, phone, status)'
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

  const defaultTab: TabId = member.status === 'pending' ? 'documents' : 'profile'
  const displayNameKh = member.full_name_kh ?? member.full_name
  const displayNameEn = member.full_name_en ?? member.full_name
  const initials = displayNameKh
    .split(' ')
    .map((part: string) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <main className="w-full space-y-6 p-6 md:p-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <Link
            href="/admin/members"
            className="inline-flex w-fit items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm font-medium text-blue-700 ring-1 ring-gray-200 transition hover:bg-blue-50 hover:text-blue-900"
          >
            <ArrowLeft className="h-4 w-4" />
            ត្រឡប់ទៅបញ្ជីសមាជិក
          </Link>
          <div className="hidden h-6 w-px bg-gray-200 sm:block" aria-hidden />
          <p className="text-sm text-gray-500">
            ព័ត៌មានលម្អិតសមាជិក · ចូលរួម {formatDate(member.joined_at ?? member.created_at)}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {member.status !== 'active' && member.status !== 'rejected' && (
            <AdminActionButton
              action={approveMember}
              id={member.id}
              successMessage="បានទទួលយកសមាជិកដោយជោគជ័យ។"
            >
              ទទួលយកសមាជិក
            </AdminActionButton>
          )}
          {member.status === 'pending' && (
            <DenyMemberButton memberId={member.id} memberName={member.full_name} />
          )}
          {member.status !== 'suspended' && member.status !== 'pending' && member.status !== 'rejected' && (
            <SuspendMemberButton memberId={member.id} memberName={member.full_name} />
          )}
        </div>
      </div>

      <section className="w-full overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="h-1.5 w-full bg-blue-800" />
        <div className="flex flex-col gap-6 p-6 lg:flex-row lg:items-start lg:justify-between lg:p-8">
          <div className="flex min-w-0 flex-1 items-start gap-4 sm:gap-5">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-blue-900 text-lg font-bold text-white shadow-sm sm:h-16 sm:w-16 sm:text-xl">
              {initials}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <MemberStatusBadge status={member.status as MemberStatus} />
                {member.is_admin && (
                  <span className="rounded-md bg-violet-100 px-2 py-0.5 text-xs font-semibold text-violet-800">
                    អ្នកគ្រប់គ្រង
                  </span>
                )}
              </div>
              <h1 className="mt-2 text-2xl font-bold tracking-tight text-gray-900 md:text-3xl">
                {displayNameKh}
              </h1>
              {displayNameEn !== displayNameKh && (
                <p className="mt-1 text-base text-gray-500">{displayNameEn}</p>
              )}
              <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-600">
                <a
                  href={`mailto:${member.email}`}
                  className="inline-flex items-center gap-2 transition hover:text-blue-700"
                >
                  <Mail className="h-4 w-4 shrink-0 text-gray-400" />
                  <span className="truncate">{member.email}</span>
                </a>
                {member.phone && (
                  <a
                    href={`tel:${member.phone}`}
                    className="inline-flex items-center gap-2 transition hover:text-blue-700"
                  >
                    <Phone className="h-4 w-4 shrink-0 text-gray-400" />
                    {member.phone}
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="grid w-full shrink-0 grid-cols-2 gap-px overflow-hidden rounded-xl border border-gray-200 bg-gray-200 sm:grid-cols-3 lg:w-auto lg:min-w-88">
            <HeroStat label="សន្សំសរុប" value={money(totalSavings)} sub={`${savings?.length ?? 0} ការផ្ទុកថ្មីៗ`} />
            <HeroStat label="កម្ជីសកម្ម" value={String(activeLoans)} sub={`${loans?.length ?? 0} កម្ជីថ្មីៗ`} />
            <HeroStat
              label="ឯកសារ"
              value={docsComplete ? 'ពេញលេញ' : 'មិនពេញ'}
              sub={docsComplete ? 'រួចរាល់ពិនិត្យ' : 'ត្រូវការពិនិត្យ'}
              className="col-span-2 sm:col-span-1"
            />
          </div>
        </div>
      </section>

      {member.status === 'suspended' && member.suspension_reason && (
        <div className="w-full rounded-xl border border-red-200 bg-red-50 px-5 py-4 md:px-6">
          <p className="text-sm font-semibold text-red-950">មូលហេតុផ្អាក</p>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-red-900">{member.suspension_reason}</p>
          {member.suspended_at && (
            <p className="mt-2 text-xs text-red-700">ផ្អាកនៅ {formatDate(member.suspended_at)}</p>
          )}
        </div>
      )}

      {member.status === 'rejected' && member.rejection_reason && (
        <div className="w-full rounded-xl border border-red-200 bg-red-50 px-5 py-4 md:px-6">
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
        savings={savings ?? []}
        loans={loans ?? []}
        idDocumentUrl={idDocumentUrl}
        residentBookUrl={residentBookUrl}
        checklist={checklist}
        docsComplete={docsComplete}
      />
    </main>
  )
}

function normalizeReferee(value: RefereeRecord | RefereeRecord[] | null): RefereeRecord | null {
  if (!value) return null
  return Array.isArray(value) ? (value[0] ?? null) : value
}

function HeroStat({
  label,
  value,
  sub,
  className = '',
}: {
  label: string
  value: string
  sub: string
  className?: string
}) {
  return (
    <div className={`bg-white px-5 py-4 sm:px-6 sm:py-5 ${className}`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-1 text-lg font-bold text-gray-900 sm:text-xl">{value}</p>
      <p className="mt-0.5 text-xs text-gray-500 sm:text-sm">{sub}</p>
    </div>
  )
}
