import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Building2, CheckCircle, Clock, FileSearch, ShieldCheck } from 'lucide-react'
import { requireMember } from '@/lib/auth/member'
import { MemberStatusBadge } from '@/components/ui/Badge'

export default async function PendingApprovalPage() {
  const member = await requireMember()

  if (member.status === 'active') {
    redirect('/dashboard')
  }

  const isPending = member.status === 'pending'

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
        <div className="mx-auto w-full max-w-4xl">
          <div className="mb-6 flex items-center justify-between">
            <Link href="/" className="inline-flex items-center gap-2 text-2xl font-bold text-blue-900 transition-colors hover:text-blue-700">
              <Building2 className="w-8 h-8" />
              SanSam
            </Link>
          </div>

          <div className="overflow-hidden rounded-3xl border border-white/70 bg-white/95 shadow-2xl shadow-blue-100/50 backdrop-blur-sm">
            <div className="border-b border-blue-100 bg-blue-50 px-6 py-5 sm:px-8">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">Membership status</p>
                  <h2 className="mt-1 text-2xl font-bold text-gray-950">
                    {isPending ? 'Registration pending approval' : 'Account not active'}
                  </h2>
                </div>
                <MemberStatusBadge status={member.status} />
              </div>
            </div>

            <div className="p-6 sm:p-8">
              <div className="text-center">
                <h1 className="text-3xl font-bold text-gray-950">
                  {isPending ? 'We are reviewing your registration' : `Your account is ${member.status}`}
                </h1>
                <p className="mx-auto mt-3 max-w-xl text-gray-600 leading-7">
                  {isPending
                    ? 'Your membership request has been received. You cannot access the member dashboard until an admin approves your account.'
                    : 'Please contact a SanSam administrator before accessing the member dashboard.'}
                </p>
              </div>

              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                {[
                  { icon: FileSearch, title: 'Document check', text: 'Admin reviews your ID and resident book.' },
                  { icon: ShieldCheck, title: 'Member approval', text: 'Your account is activated after review.' },
                  { icon: CheckCircle, title: 'Dashboard access', text: 'Savings and loan tools unlock after approval.' },
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
                <p className="font-semibold text-blue-950">What should I do now?</p>
                <p className="mt-2 text-sm leading-6 text-blue-800">
                  Wait for admin approval. If your registration is urgent or has been pending too long, contact a SanSam admin and confirm your submitted documents are clear.
                </p>
              </div>

              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Link href="/" className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50">
                  Back to home
                </Link>

              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
