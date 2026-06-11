import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Building2, CheckCircle, FileSearch, ShieldAlert, ShieldCheck } from 'lucide-react'
import { getMemberHomePath, requireMember } from '@/lib/auth/member'
import { MemberStatusBadge } from '@/components/ui/Badge'
import { formatDate } from '@/app/admin/adminUtils'

export default async function PendingApprovalPage() {
  const member = await requireMember()

  if (member.status === 'active') {
    redirect(getMemberHomePath(member))
  }

  const isPending = member.status === 'pending'
  const isSuspended = member.status === 'suspended'
  const isRejected = member.status === 'rejected'
  const isNegative = isSuspended || isRejected

  const STATUS_LABELS: Record<string, string> = {
    pending: 'រង់ចាំ',
    suspended: 'ផ្អាក',
    rejected: 'បដិសេធ',
    withdrawn: 'បានដក',
    active: 'សកម្ម',
  }
  const statusLabel = STATUS_LABELS[member.status] ?? member.status

  return (
    <main className="min-h-screen bg-background">
      <section className="px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
        <div className="mx-auto w-full max-w-4xl">
          <div className="mb-6 flex items-center justify-between">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-2xl font-bold text-brand-900 transition-colors hover:text-brand-700"
            >
              <Building2 className="w-8 h-8" />
              សន្សំ
            </Link>
          </div>

          <div className="overflow-hidden rounded-3xl border border-white/70 bg-white/95 shadow-2xl shadow-brand-100/50 backdrop-blur-sm">
            <div
              className={`border-b px-6 py-5 sm:px-8 ${
                isNegative ? 'border-red-100 bg-red-50' : 'border-brand-100 bg-brand-50'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p
                    className={`text-sm font-semibold uppercase tracking-wide ${
                      isNegative ? 'text-red-700' : 'text-brand-700'
                    }`}
                  >
                    ស្ថានភាពចូលជាសមាជិក
                  </p>
                  <h2 className="mt-1 text-2xl font-bold text-gray-950">
                    {isPending
                      ? 'ការចុះឈ្មោះកំពុងរង់ចាំការទទួលយក'
                      : isSuspended
                        ? 'គណនីរបស់អ្នកត្រូវបានផ្អាក'
                        : isRejected
                          ? 'ការចុះឈ្មោះរបស់អ្នកត្រូវបានបដិសេធ'
                          : 'គណនីមិនទាន់ដំណើរការ'}
                  </h2>
                </div>
                <MemberStatusBadge status={member.status} />
              </div>
            </div>

            <div className="p-6 sm:p-8">
              <div className="text-center">
                <h1 className="text-3xl font-bold text-gray-950">
                  {isPending
                    ? 'យើងកំពុងពិនិត្យការចុះឈ្មោះរបស់អ្នក'
                    : isSuspended
                      ? 'គណនីរបស់អ្នកត្រូវបានផ្អាកជាបណ្តោះអាសន្ន'
                      : isRejected
                        ? 'ការចុះឈ្មោះរបស់អ្នកមិនត្រូវបានទទួលយកទេ'
                        : `គណនីរបស់អ្នកស្ថិតក្នុងស្ថានភាព ${statusLabel}`}
                </h1>
                <p className="mx-auto mt-3 max-w-xl text-gray-600 leading-7">
                  {isPending
                    ? 'ពាក្យសុំចូលជាសមាជិករបស់អ្នកត្រូវបានទទួលហើយ។ អ្នកមិនអាចចូលប្រើផ្ទាំងគ្រប់គ្រងសមាជិកបានទេ រហូតដល់អ្នកគ្រប់គ្រងទទួលយកគណនីរបស់អ្នក។'
                    : isSuspended
                      ? 'អ្នកមិនអាចប្រើប្រាស់ផ្ទាំងគ្រប់គ្រងសមាជិកបានទេ រហូតដល់អ្នកគ្រប់គ្រងដោះស្រាយ និង ទទួលយកគណនីរបស់អ្នកឡើងវិញ។'
                      : isRejected
                        ? 'ការចុះឈ្មោះចូលជាសមាជិករបស់អ្នកត្រូវបានបដិសេធ។ សូមមើលមូលហេតុខាងក្រោម ឬ ទាក់ទងអ្នកគ្រប់គ្រងសន្សំសម្រាប់ព័ត៌មានបន្ថែម។'
                        : 'សូមទាក់ទងអ្នកគ្រប់គ្រងសន្សំមុនពេលចូលប្រើផ្ទាំងគ្រប់គ្រងសមាជិក។'}
                </p>
              </div>

              {isSuspended && (
                <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-5 text-left">
                  <div className="mb-3 flex items-center gap-2 font-semibold text-red-950">
                    <ShieldAlert className="h-5 w-5 shrink-0" />
                    មូលហេតុផ្អាកគណនី
                  </div>
                  {member.suspension_reason ? (
                    <p className="whitespace-pre-wrap text-sm leading-7 text-red-900">
                      {member.suspension_reason}
                    </p>
                  ) : (
                    <p className="text-sm text-red-800">
                      មិនមានមូលហេតុត្រូវបានកត់ត្រាទេ។ សូមទាក់ទងអ្នកគ្រប់គ្រងសន្សំសម្រាប់ព័ត៌មានបន្ថែម។
                    </p>
                  )}
                  {member.suspended_at && (
                    <p className="mt-3 text-xs font-medium text-red-700/80">
                      ផ្អាកនៅថ្ងៃ {formatDate(member.suspended_at)}
                    </p>
                  )}
                </div>
              )}

              {isRejected && (
                <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-5 text-left">
                  <div className="mb-3 flex items-center gap-2 font-semibold text-red-950">
                    <ShieldAlert className="h-5 w-5 shrink-0" />
                    មូលហេតុបដិសេធការចុះឈ្មោះ
                  </div>
                  {member.rejection_reason ? (
                    <p className="whitespace-pre-wrap text-sm leading-7 text-red-900">
                      {member.rejection_reason}
                    </p>
                  ) : (
                    <p className="text-sm text-red-800">
                      មិនមានមូលហេតុត្រូវបានកត់ត្រាទេ។ សូមទាក់ទងអ្នកគ្រប់គ្រងសន្សំសម្រាប់ព័ត៌មានបន្ថែម។
                    </p>
                  )}
                  {member.rejected_at && (
                    <p className="mt-3 text-xs font-medium text-red-700/80">
                      បដិសេធនៅថ្ងៃ {formatDate(member.rejected_at)}
                    </p>
                  )}
                </div>
              )}

              {isPending && (
                <>
                  <div className="mt-8 grid gap-4 sm:grid-cols-3">
                    {[
                      {
                        icon: FileSearch,
                        title: 'ការត្រួតពិនិត្យឯកសារ',
                        text: 'អ្នកគ្រប់គ្រងពិនិត្យអត្តសញ្ញាណប័ណ្ណ និង សៀវភៅគ្រួសាររបស់អ្នក។',
                      },
                      {
                        icon: ShieldCheck,
                        title: 'ការទទួលយកសមាជិក',
                        text: 'គណនីរបស់អ្នកនឹងដំណើរការបន្ទាប់ពីការត្រួតពិនិត្យ។',
                      },
                      {
                        icon: CheckCircle,
                        title: 'ការចូលផ្ទាំងគ្រប់គ្រង',
                        text: 'ឧបករណ៍សន្សំ និង កម្ជីនឹងបើកបន្ទាប់ពីការទទួលយក។',
                      },
                    ].map((item) => {
                      const Icon = item.icon
                      return (
                        <div
                          key={item.title}
                          className="rounded-2xl border border-slate-200 bg-background/80 p-4 text-center shadow-xs"
                        >
                          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white ring-1 ring-slate-200">
                            <Icon className="h-5 w-5 text-brand-800" />
                          </div>
                          <p className="font-semibold text-gray-950">{item.title}</p>
                          <p className="mt-2 text-sm text-gray-500">{item.text}</p>
                        </div>
                      )
                    })}
                  </div>

                  <div className="mt-8 rounded-2xl border border-brand-100 bg-brand-50/80 p-5">
                    <p className="font-semibold text-brand-950">តើខ្ញុំគួរធ្វើអ្វីឥឡូវនេះ?</p>
                    <p className="mt-2 text-sm leading-6 text-brand-800">
                      រង់ចាំការទទួលយកពីអ្នកគ្រប់គ្រង។ ប្រសិនបើការចុះឈ្មោះរបស់អ្នកមានភាពបន្ទាន់ ឬ
                      កំពុងរង់ចាំយូរពេក សូមទាក់ទងអ្នកគ្រប់គ្រងសន្សំ និង បញ្ជាក់ថាឯកសារដែលបានដាក់ស្នើច្បាស់។
                    </p>
                  </div>
                </>
              )}

              {isSuspended && (
                <div className="mt-8 rounded-2xl border border-amber-100 bg-amber-50/80 p-5">
                  <p className="font-semibold text-amber-950">តើខ្ញុំអាចធ្វើអ្វីបាន?</p>
                  <p className="mt-2 text-sm leading-6 text-amber-900">
                    សូមទាក់ទងអ្នកគ្រប់គ្រងសន្សំដើម្បីពិភាក្សាអំពីមូលហេតុផ្អាក និង ជំហានបន្ទាប់ដើម្បីទទួលបានការទទួលយកគណនីឡើងវិញ។
                  </p>
                </div>
              )}

              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Link
                  href="/"
                  className="rounded-xl border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
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
