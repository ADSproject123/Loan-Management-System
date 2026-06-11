'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  CreditCard,
  Eye,
  EyeOff,
  Lock,
  Mail,
  PiggyBank,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from 'lucide-react'
import { signInMember } from '@/app/actions/auth'
import { LoadingSpinner } from '@/components/ui/Loading'
import { showError } from '@/lib/toast'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const result = await signInMember(email, password)

      if (!result.success) {
        showError(result.error ?? 'មិនអាចចូលគណនីបានទេនៅពេលនេះ។ សូមព្យាយាមម្តងទៀត។')
        return
      }

      router.push(result.redirectTo ?? '/dashboard')
      router.refresh()
    } catch {
      showError('មិនអាចចូលគណនីបានទេនៅពេលនេះ។ សូមព្យាយាមម្តងទៀត។')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto grid min-h-screen w-full max-w-[1400px] grid-cols-1 lg:grid-cols-[440px_1fr]">
        <BrandPanel />

        <main className="relative flex min-h-screen flex-col bg-background">
          {/* Mobile header */}
          <header className="flex items-center justify-between border-b border-slate-200 bg-white/80 px-4 py-4 backdrop-blur-sm sm:px-8 lg:hidden">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-lg font-bold text-brand-950"
            >
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-950 text-white">
                <Building2 className="h-5 w-5" />
              </span>
              សន្សំ
            </Link>
            <Link
              href="/register"
              className="text-sm font-semibold text-brand-900 hover:text-brand-700"
            >
              ចុះឈ្មោះ
            </Link>
          </header>

          {/* Desktop header */}
          <div className="hidden items-center justify-end border-b border-slate-200 bg-white/60 px-8 py-5 backdrop-blur-sm lg:flex">
            <span className="mr-4 text-sm text-slate-500">មិនទាន់មានគណនី?</span>
            <Link
              href="/register"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-brand-900 transition hover:border-brand-200 hover:text-brand-700"
            >
              ចុះឈ្មោះឥឡូវនេះ
            </Link>
          </div>

          {/* Form area */}
          <div className="flex flex-1 flex-col px-4 py-8 sm:px-8 lg:px-12 lg:py-12">
            <div className="mx-auto w-full max-w-md">
              <div className="mb-8">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
                  វិបផតថលសមាជិក
                </p>
                <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 sm:text-[34px]">
                  សូមស្វាគមន៍ការត្រឡប់មកវិញ
                </h1>
                <p className="mt-2 text-[15px] leading-6 text-slate-600">
                  ចូលគណនីដើម្បីគ្រប់គ្រងការសន្សំ កម្ជី និង សកម្មភាពសមាជិករបស់អ្នក។
                </p>
              </div>

              <div className="rounded-3xl border border-border bg-surface p-6 shadow-sm shadow-slate-200/40 sm:p-8">
                <form onSubmit={handleLogin} className="space-y-5">
                  <Field label="អាសយដ្ឋានអ៊ីមែល" htmlFor="email">
                    <IconInput
                      id="email"
                      icon={<Mail className="h-4.5 w-4.5" />}
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                    />
                  </Field>

                  <Field
                    label="ពាក្យសម្ងាត់"
                    htmlFor="password"
                    trailingLabel={
                      <Link
                        href="/forgot-password"
                        className="text-xs font-semibold text-brand-700 transition hover:text-brand-900"
                      >
                        ភ្លេចពាក្យសម្ងាត់?
                      </Link>
                    }
                  >
                    <IconInput
                      id="password"
                      icon={<Lock className="h-4.5 w-4.5" />}
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="បញ្ចូលពាក្យសម្ងាត់របស់អ្នក"
                      required
                      trailing={
                        <button
                          type="button"
                          aria-label={showPassword ? 'លាក់ពាក្យសម្ងាត់' : 'បង្ហាញពាក្យសម្ងាត់'}
                          onClick={() => setShowPassword(!showPassword)}
                          className="rounded-lg bg-slate-100 p-2 text-slate-400 transition hover:bg-slate-200 hover:text-slate-600"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      }
                    />
                  </Field>

                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-950 px-6 py-3 text-sm font-semibold text-white shadow-sm shadow-brand-950/10 transition hover:bg-brand-950 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? (
                      <>
                        <LoadingSpinner size="sm" color="white" />
                        កំពុងចូលគណនី...
                      </>
                    ) : (
                      <>
                        ចូលគណនី
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </form>

                <div className="relative my-7">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-200" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-white px-3 text-xs text-slate-400">ឬ</span>
                  </div>
                </div>

                <Link
                  href="/register"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-background"
                >
                  បង្កើតគណនីសមាជិកថ្មី
                </Link>
              </div>

              <p className="mt-8 text-center text-xs text-slate-400 sm:text-left">
                ដោយចូលគណនី អ្នកយល់ព្រមថាគណនីរបស់អ្នកត្រូវបានប្រើដោយខ្លួនអ្នកផ្ទាល់ និង
                ការសម្ងាត់ត្រូវបានរក្សាដោយសុវត្ថិភាព។{' '}
                <Link href="/" className="font-semibold text-brand-700 hover:text-brand-900">
                  ត្រឡប់ទៅទំព័រដើម
                </Link>
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

function BrandPanel() {
  const benefits = [
    {
      icon: PiggyBank,
      title: 'សន្សំទទួលការប្រាក់ ៣%',
      description: 'ការប្រាក់ប្រចាំខែលើសមតុល្យសន្សំសរុបរបស់អ្នក។',
    },
    {
      icon: CreditCard,
      title: 'កម្ជីសមាជិកដោយយុត្តិធម៌',
      description: 'ដាក់ស្នើ តាមដាន និង សងកម្ជីតាមដំណើរការតម្លាភាព។',
    },
    {
      icon: TrendingUp,
      title: 'របាយការណ៍ភ្លាមៗ',
      description: 'ទទួលរបាយការណ៍សន្សំ និង កម្ជីតាមរយៈ Telegram។',
    },
  ]

  return (
    <aside className="app-brand-panel relative hidden overflow-hidden lg:flex lg:flex-col">
      <div className="relative flex h-full flex-col px-10 py-10">
        <Link href="/" className="inline-flex w-fit items-center gap-2.5 group">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/10 ring-1 ring-white/15 transition group-hover:bg-white/15">
            <Building2 className="h-5 w-5 text-white" />
          </span>
          <span className="text-lg font-bold tracking-tight">សមាគមន៏សន្សំ</span>
        </Link>

        <div className="mt-14">
          <h2 className="mt-5 text-[28px] font-bold leading-[1.2]">
            បន្តដំណើរហិរញ្ញវត្ថុរបស់អ្នកជាមួយសន្សំ។
          </h2>
          <p className="mt-3 text-[15px] leading-7 text-brand-100/85">
            ចូលគណនីដើម្បីបន្ថែមការសន្សំ ស្នើសុំកម្ជី មើលរបាយការណ៍ និង
            តាមដានគ្រប់សកម្មភាពសមាជិករបស់អ្នក។
          </p>
        </div>

        <ul className="mt-10 space-y-4">
          {benefits.map((benefit) => {
            const Icon = benefit.icon
            return (
              <li
                key={benefit.title}
                className="flex items-start gap-4 rounded-2xl bg-white/5 px-4 py-3 ring-1 ring-white/10"
              >
                <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/10 ring-1 ring-white/15">
                  <Icon className="h-4.5 w-4.5 text-brand-100" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-white">{benefit.title}</p>
                  <p className="mt-0.5 text-xs leading-5 text-brand-200/80">{benefit.description}</p>
                </div>
              </li>
            )
          })}
        </ul>

        <div className="mt-auto pt-10">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-brand-100">
              <ShieldCheck className="h-5 w-5" />
              <p className="text-sm font-semibold">ការចូលគណនីដោយសុវត្ថិភាព</p>
            </div>
            <p className="mt-2 flex items-start gap-2 text-xs leading-5 text-brand-200/85">
              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-300" />
              ព័ត៌មានគណនី និង ឯកសាររបស់អ្នកត្រូវបានអ៊ិនគ្រីប និង រក្សាការសម្ងាត់។
            </p>
          </div>
        </div>
      </div>
    </aside>
  )
}

interface FieldShellProps {
  label: string
  htmlFor: string
  trailingLabel?: React.ReactNode
  children: React.ReactNode
}

function Field({ label, htmlFor, trailingLabel, children }: FieldShellProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={htmlFor} className="text-sm font-semibold text-slate-800">
          {label}
        </label>
        {trailingLabel}
      </div>
      {children}
    </div>
  )
}

const inputBase =
  'app-input shadow-xs'

interface IconInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon: React.ReactNode
  trailing?: React.ReactNode
}

function IconInput({ icon, trailing, className = '', ...rest }: IconInputProps) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
        {icon}
      </span>
      <input
        {...rest}
        className={`${inputBase} app-input--with-icon ${trailing ? 'app-input--with-trailing' : ''} ${className}`}
      />
      {trailing && (
        <div className="absolute right-2 top-1/2 -translate-y-1/2">{trailing}</div>
      )}
    </div>
  )
}
