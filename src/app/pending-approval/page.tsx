import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Building2, CheckCircle, FileSearch, ShieldCheck } from 'lucide-react'
import { requireMember } from '@/lib/auth/member'
import { MemberStatusBadge } from '@/components/ui/Badge'

export default async function PendingApprovalPage() {
  const member = await requireMember()

  if (member.status === 'active') {
    redirect('/dashboard')
  }

  const isPending = member.status === 'pending'
  const STATUS_LABELS: Record<string, string> = {
    pending: 'រង់ចាំ',
    suspended: 'ផ្អាក',
    withdrawn: 'បានដក',
    active: 'សកម្ម',
  }
  const statusLabel = STATUS_LABELS[member.status] ?? member.status

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
        <div className="mx-auto w-full max-w-4xl">
          <div className="mb-6 flex items-center justify-between">
            <Link href="/" className="inline-flex items-center gap-2 text-2xl font-bold text-blue-900 transition-colors hover:text-blue-700">
              <Building2 className="w-8 h-8" />
              សន្សំ
            </Link>
          </div>

          <div className="overflow-hidden rounded-3xl border border-white/70 bg-white/95 shadow-2xl shadow-blue-100/50 backdrop-blur-sm">
            <div className="border-b border-blue-100 bg-blue-50 px-6 py-5 sm:px-8">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">ស្ថានភាពចូលជាសមាជិក</p>
                  <h2 className="mt-1 text-2xl font-bold text-gray-950">
                    {isPending ? 'ការចុះឈ្មោះកំពុងរង់ចាំការអនុម័ត' : 'គណនីមិនទាន់ដំណើរការ'}
                  </h2>
                </div>
                <MemberStatusBadge status={member.status} />
              </div>
            </div>

            <div className="p-6 sm:p-8">
              <div className="text-center">
                <h1 className="text-3xl font-bold text-gray-950">
                  {isPending ? 'យើងកំពុងពិនិត្យការចុះឈ្មោះរបស់អ្នក' : `គណនីរបស់អ្នកស្ថិតក្នុងស្ថានភាព ${statusLabel}`}
                </h1>
                <p className="mx-auto mt-3 max-w-xl text-gray-600 leading-7">
                  {isPending
                    ? 'ពាក្យសុំចូលជាសមាជិករបស់អ្នកត្រូវបានទទួលហើយ។ អ្នកមិនអាចចូលប្រើផ្ទាំងគ្រប់គ្រងសមាជិកបានទេ រហូតដល់អ្នកគ្រប់គ្រងអនុម័តគណនីរបស់អ្នក។'
                    : 'សូមទាក់ទងអ្នកគ្រប់គ្រងសន្សំមុនពេលចូលប្រើផ្ទាំងគ្រប់គ្រងសមាជិក។'}
                </p>
              </div>

              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                {[
                  { icon: FileSearch, title: 'ការត្រួតពិនិត្យឯកសារ', text: 'អ្នកគ្រប់គ្រងពិនិត្យអត្តសញ្ញាណប័ណ្ណ និង សៀវភៅគ្រួសាររបស់អ្នក។' },
                  { icon: ShieldCheck, title: 'ការអនុម័តសមាជិក', text: 'គណនីរបស់អ្នកនឹងដំណើរការបន្ទាប់ពីការត្រួតពិនិត្យ។' },
                  { icon: CheckCircle, title: 'ការចូលផ្ទាំងគ្រប់គ្រង', text: 'ឧបករណ៍សន្សំ និង ឥណទាននឹងបើកបន្ទាប់ពីការអនុម័ត។' },
                ].map((item) => {
                  const Icon = item.icon
                  return (
                    <div key={item.title} className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 text-center shadow-xs">
                      <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white ring-1 ring-slate-200">
                        <Icon className="h-5 w-5 text-blue-800" />
                      </div>
                      <p className="font-semibold text-gray-950">{item.title}</p>
                      <p className="mt-2 text-sm text-gray-500">{item.text}</p>
                    </div>
                  )
                })}
              </div>

              <div className="mt-8 rounded-2xl border border-blue-100 bg-blue-50/80 p-5">
                <p className="font-semibold text-blue-950">តើខ្ញុំគួរធ្វើអ្វីឥឡូវនេះ?</p>
                <p className="mt-2 text-sm leading-6 text-blue-800">
                  រង់ចាំការអនុម័តពីអ្នកគ្រប់គ្រង។ ប្រសិនបើការចុះឈ្មោះរបស់អ្នកមានភាពបន្ទាន់ ឬ កំពុងរង់ចាំយូរពេក សូមទាក់ទងអ្នកគ្រប់គ្រងសន្សំ និង បញ្ជាក់ថាឯកសារដែលបានដាក់ស្នើច្បាស់។
                </p>
              </div>

              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Link href="/" className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50">
                  ត្រឡប់ទៅទំព័រដើម
                </Link>

              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
