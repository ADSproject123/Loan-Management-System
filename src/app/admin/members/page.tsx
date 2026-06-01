import { Clock, UserCheck, UserMinus, Users } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/admin'
import { approveMember, suspendMember } from '@/app/actions/admin'
import { MembersList, type MemberListItem } from '@/app/admin/members/MembersList'
export default async function AdminMembersPage() {
  const admin = createAdminClient()
  const { data } = await admin
    .from('members')
    .select(
      'id, full_name, email, phone, status, id_document_url, resident_book_url, created_at'
    )
    .order('created_at', { ascending: false })

  const members = (data ?? []) as MemberListItem[]

  const stats = {
    total: members.length,
    pending: members.filter((m) => m.status === 'pending').length,
    active: members.filter((m) => m.status === 'active').length,
    suspended: members.filter((m) => m.status === 'suspended').length,
  }

  const pendingWithDocs = members.filter(
    (m) =>
      m.status === 'pending' &&
      m.id_document_url &&
      m.resident_book_url
  ).length

  return (
    <main className="space-y-8 p-6 md:p-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">អ្នកគ្រប់គ្រង</p>
          <h2 className="mt-1 text-2xl font-bold text-gray-900 md:text-3xl">សមាជិក</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
            ត្រួតពិនិត្យការចុះឈ្មោះ ផ្ទៀងផ្ទាត់ឯកសារ និងអនុម័តគណនី។ ចុចលើសមាជិកណាម្នាក់មួយដើម្បីមើលព័ត៌មានលម្អិត និងឯកសារ។
          </p>
        </div>        
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="សមាជិកទាំងអស់"
          value={stats.total}
          icon={Users}
          tone="blue"
        />
        <StatCard
          label="រង់ចាំអនុម័ត"
          value={stats.pending}
          icon={Clock}
          tone="amber"
        />
        <StatCard label="សកម្ម" value={stats.active} icon={UserCheck} tone="emerald" />
        <StatCard label="ផ្អាក" value={stats.suspended} icon={UserMinus} tone="slate" />
      </div>

      <MembersList
        members={members}
        approveAction={approveMember}
        suspendAction={suspendMember}
      />
    </main>
  )
}

function StatCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string
  value: number
  icon: React.ComponentType<{ className?: string }>
  tone: 'blue' | 'amber' | 'emerald' | 'slate'
}) {
  const tones = {
    blue: 'bg-blue-50 text-blue-900 ring-blue-100',
    amber: 'bg-amber-50 text-amber-900 ring-amber-100',
    emerald: 'bg-emerald-50 text-emerald-900 ring-emerald-100',
    slate: 'bg-slate-100 text-slate-800 ring-slate-200',
  }
  const iconTones = {
    blue: 'bg-blue-100 text-blue-700',
    amber: 'bg-amber-100 text-amber-700',
    emerald: 'bg-emerald-100 text-emerald-700',
    slate: 'bg-white text-slate-600',
  }

  return (
    <div className={`rounded-2xl p-5 ring-1 ${tones[tone]}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide opacity-70">{label}</p>
          <p className="mt-2 text-3xl font-bold tabular-nums">{value}</p>
        </div>
        <span className={`grid h-10 w-10 place-items-center rounded-xl ${iconTones[tone]}`}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </div>
  )
}
