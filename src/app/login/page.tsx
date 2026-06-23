'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowRight,
  Building2,
  CreditCard,
  Eye,
  EyeOff,
  Lock,
  Phone,
  PiggyBank,
  ShieldCheck,
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
        showError(result.error ?? 'មិនអាចចូលគណនីបានទេ។ សូមព្យាយាមម្តងទៀត។')
        return
      }
      router.push(result.redirectTo ?? '/dashboard')
      router.refresh()
    } catch {
      showError('មិនអាចចូលគណនីបានទេ។ សូមព្យាយាមម្តងទៀត។')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto grid min-h-screen w-full max-w-[1400px] grid-cols-1 lg:grid-cols-[440px_1fr]">
        <BrandPanel />

        <main className="flex min-h-screen flex-col bg-background">
          {/* Top bar */}
          <div className="flex items-center justify-between border-b border-border px-6 py-4 sm:px-8">
            <Link href="/" className="flex items-center gap-2 lg:hidden">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-950 text-white">
                <Building2 className="h-4 w-4" />
              </span>
              <span className="text-sm font-bold text-brand-950">សមាគមន៏សន្សំ</span>
            </Link>
            <span className="hidden text-sm text-muted lg:block" />
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted">មិនទាន់មានគណនី?</span>
              <Link
                href="/register"
                className="rounded-lg border border-border bg-surface px-3.5 py-2 text-sm font-semibold text-foreground transition hover:border-brand-200 hover:text-brand-700"
              >
                ចុះឈ្មោះ
              </Link>
            </div>
          </div>

          {/* Form */}
          <div className="flex flex-1 items-center justify-center px-6 py-10 sm:px-8">
            <div className="w-full max-w-md">
              <div className="mb-8">
                <p className="text-xs font-semibold uppercase tracking-widest text-brand-700">
                  វិបផតថលសមាជិក
                </p>
                <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground">
                  សូមស្វាគមន៍ការត្រឡប់មកវិញ
                </h1>
                <p className="mt-2 text-sm leading-6 text-muted">
                  ចូលគណនីដើម្បីគ្រប់គ្រងការសន្សំ កម្ជី និង សកម្មភាពសមាជិករបស់អ្នក។
                </p>
              </div>

              <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm sm:p-8">
                <form onSubmit={handleLogin} className="space-y-5">
                  <Field label="អ៊ីមែល ឬ លេខទូរស័ព្ទ" htmlFor="email">
                    <div className="relative">
                      <Phone className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                      <input
                        id="email"
                        type="text"
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com ឬ 0812345678"
                        required
                        className="app-input app-input--with-icon shadow-xs"
                      />
                    </div>
                  </Field>

                  <Field
                    label="ពាក្យសម្ងាត់"
                    htmlFor="password"
                    trailing={
                      <Link
                        href="/forgot-password"
                        className="text-xs font-semibold text-brand-700 hover:text-brand-900"
                      >
                        ភ្លេចពាក្យសម្ងាត់?
                      </Link>
                    }
                  >
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                      <input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="បញ្ចូលពាក្យសម្ងាត់"
                        required
                        className="app-input app-input--with-icon app-input--with-trailing shadow-xs"
                      />
                      <button
                        type="button"
                        aria-label={showPassword ? 'លាក់ពាក្យសម្ងាត់' : 'បង្ហាញពាក្យសម្ងាត់'}
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-muted transition hover:bg-surface-muted hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </Field>

                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-900 disabled:cursor-not-allowed disabled:opacity-60"
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
              </div>

              <p className="mt-6 text-center text-sm text-muted">
                មិនទាន់មានគណនី?{' '}
                <Link href="/register" className="font-semibold text-brand-700 hover:text-brand-900">
                  ចុះឈ្មោះឥឡូវនេះ
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
      title: 'តាមដានភ្លាមៗ',
      description: 'ទទួលការជូនដំណឹងសន្សំ និង កម្ជីតាមរយៈ Telegram។',
    },
  ]

  return (
    <aside className="app-brand-panel relative hidden overflow-hidden lg:flex lg:flex-col">
      <div className="relative flex h-full flex-col px-10 py-10">
        <Link href="/" className="group inline-flex w-fit items-center gap-2.5">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/10 ring-1 ring-white/15 transition group-hover:bg-white/15">
            <Building2 className="h-5 w-5 text-white" />
          </span>
          <span className="text-lg font-bold tracking-tight">សមាគមន៏សន្សំ</span>
        </Link>

        <div className="mt-14">
          <h2 className="text-[28px] font-bold leading-[1.2]">
            បន្តដំណើរហិរញ្ញវត្ថុរបស់អ្នកជាមួយសន្សំ។
          </h2>
          <p className="mt-3 text-[15px] leading-7 text-brand-100/85">
            ចូលគណនីដើម្បីបន្ថែមការសន្សំ ស្នើសុំកម្ជី មើលរបាយការណ៍ និង តាមដានគ្រប់សកម្មភាព។
          </p>
        </div>

        <ul className="mt-10 space-y-3">
          {benefits.map((b) => (
            <li key={b.title} className="flex items-start gap-4 rounded-2xl bg-white/5 px-4 py-3 ring-1 ring-white/10">
              <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/10 ring-1 ring-white/15">
                <b.icon className="h-4 w-4 text-brand-100" />
              </span>
              <div>
                <p className="text-sm font-semibold text-white">{b.title}</p>
                <p className="mt-0.5 text-xs leading-5 text-brand-200/80">{b.description}</p>
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-auto pt-10">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="flex items-center gap-2 text-brand-100">
              <ShieldCheck className="h-4 w-4" />
              <p className="text-sm font-semibold">ការចូលគណនីដោយសុវត្ថិភាព</p>
            </div>
            <p className="mt-2 text-xs leading-5 text-brand-200/80">
              ព័ត៌មានគណនីរបស់អ្នកត្រូវបានអ៊ិនគ្រីប និង រក្សាការសម្ងាត់។
            </p>
          </div>
        </div>
      </div>
    </aside>
  )
}

function Field({
  label,
  htmlFor,
  trailing,
  children,
}: {
  label: string
  htmlFor: string
  trailing?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={htmlFor} className="text-sm font-semibold text-foreground">
          {label}
        </label>
        {trailing}
      </div>
      {children}
    </div>
  )
}
