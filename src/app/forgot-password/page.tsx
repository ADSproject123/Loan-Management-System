'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CreditCard,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  Phone,
  PiggyBank,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react'
import { requestPasswordReset, confirmPasswordReset } from '@/app/actions/auth'
import { LoadingSpinner } from '@/components/ui/Loading'
import { showError, showSuccess } from '@/lib/toast'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [step, setStep] = useState<'identifier' | 'reset'>('identifier')
  const [identifier, setIdentifier] = useState('')
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const sendCode = async () => {
    setLoading(true)
    try {
      const result = await requestPasswordReset(identifier)
      if (!result.success) {
        showError(result.error ?? 'មិនអាចផ្ញើលេខកូដបានទេ។ សូមព្យាយាមម្តងទៀត។')
        return
      }
      showSuccess('លេខកូដត្រូវបានផ្ញើទៅ Telegram របស់អ្នក។')
      setStep('reset')
    } catch {
      showError('មិនអាចផ្ញើលេខកូដបានទេ។ សូមព្យាយាមម្តងទៀត។')
    } finally {
      setLoading(false)
    }
  }

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault()
    await sendCode()
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const result = await confirmPasswordReset({ identifier, code, newPassword, confirmPassword })
      if (!result.success) {
        showError(result.error ?? 'មិនអាចប្តូរពាក្យសម្ងាត់បានទេ។')
        return
      }
      showSuccess('ពាក្យសម្ងាត់របស់អ្នកត្រូវបានប្តូរដោយជោគជ័យ។ សូមចូលគណនីម្តងទៀត។')
      router.push('/login')
    } catch {
      showError('មិនអាចប្តូរពាក្យសម្ងាត់បានទេ។')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="min-h-screen w-full">
        <BrandPanel />

        <main className="flex min-h-screen flex-col bg-background lg:ml-[30%]">
          <div className="flex items-center justify-between border-b border-border px-6 py-4 sm:px-8">
            <Link href="/" className="flex items-center gap-2 lg:hidden">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-950 text-white">
                <Building2 className="h-4 w-4" />
              </span>
              <span className="text-sm font-bold text-brand-950">សមាគមន៏សន្សំ</span>
            </Link>
            <span className="hidden text-sm text-muted lg:block" />
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-foreground hover:text-brand-700"
            >
              <ArrowLeft className="h-4 w-4" />
              ត្រឡប់ទៅចូលគណនី
            </Link>
          </div>

          <div className="flex flex-1 items-center justify-center px-6 py-10 sm:px-12">
            <div className="w-full max-w-xl">
              <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight text-foreground">ភ្លេចពាក្យសម្ងាត់?</h1>
                <p className="mt-2 text-sm leading-6 text-muted">
                  {step === 'identifier'
                    ? 'បញ្ចូលអ៊ីមែល ឬ លេខទូរស័ព្ទរបស់អ្នក។ យើងនឹងផ្ញើលេខកូដទៅ Telegram ដែលបានភ្ជាប់ជាមួយគណនីរបស់អ្នក។'
                    : 'បញ្ចូលលេខកូដដែលបានផ្ញើទៅ Telegram របស់អ្នក ជាមួយពាក្យសម្ងាត់ថ្មី។'}
                </p>
              </div>

              <div className="border border-border bg-surface p-8 sm:p-10">
                {step === 'identifier' ? (
                  <form onSubmit={handleSendCode} className="space-y-5">
                    <Field label="អ៊ីមែល ឬ លេខទូរស័ព្ទ" htmlFor="identifier">
                      <div className="relative">
                        <Phone className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                        <input
                          id="identifier"
                          type="text"
                          autoComplete="username"
                          value={identifier}
                          onChange={(e) => setIdentifier(e.target.value)}
                          placeholder="you@example.com ឬ 0812345678"
                          required
                          className="app-input app-input--with-icon shadow-xs"
                        />
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
                          កំពុងផ្ញើ...
                        </>
                      ) : (
                        <>
                          ផ្ញើលេខកូដ
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleResetPassword} className="space-y-5">
                    <Field label="លេខកូដពី Telegram" htmlFor="code">
                      <div className="relative">
                        <KeyRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                        <input
                          id="code"
                          type="text"
                          inputMode="numeric"
                          maxLength={6}
                          autoComplete="one-time-code"
                          value={code}
                          onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          placeholder="123456"
                          required
                          className="app-input app-input--with-icon shadow-xs"
                        />
                      </div>
                    </Field>

                    <Field label="ពាក្យសម្ងាត់ថ្មី" htmlFor="new_password" hint="យ៉ាងតិច ៨ តួអក្សរ">
                      <div className="relative">
                        <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                        <input
                          id="new_password"
                          type={showPassword ? 'text' : 'password'}
                          autoComplete="new-password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="បញ្ចូលពាក្យសម្ងាត់ថ្មី"
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

                    <Field label="បញ្ជាក់ពាក្យសម្ងាត់ថ្មី" htmlFor="confirm_password">
                      <div className="relative">
                        <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                        <input
                          id="confirm_password"
                          type={showPassword ? 'text' : 'password'}
                          autoComplete="new-password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="បញ្ចូលពាក្យសម្ងាត់ថ្មីម្តងទៀត"
                          required
                          className="app-input app-input--with-icon shadow-xs"
                        />
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
                          កំពុងកំណត់...
                        </>
                      ) : (
                        'កំណត់ពាក្យសម្ងាត់ថ្មី'
                      )}
                    </button>

                    <div className="flex items-center justify-between text-xs">
                      <button
                        type="button"
                        onClick={() => setStep('identifier')}
                        className="font-semibold text-foreground hover:text-brand-700"
                      >
                        ប្តូរអ៊ីមែល/លេខទូរស័ព្ទ
                      </button>
                      <button
                        type="button"
                        onClick={() => sendCode()}
                        className="font-semibold text-brand-700 hover:text-brand-900"
                      >
                        ផ្ញើលេខកូដម្តងទៀត
                      </button>
                    </div>
                  </form>
                )}
              </div>
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
    <aside className="app-brand-panel fixed inset-y-0 left-0 hidden w-[30%] overflow-hidden lg:flex lg:flex-col">
      <div className="relative flex h-full flex-col px-10 py-10">
        <Link href="/" className="group inline-flex w-fit items-center gap-2.5">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/10 ring-1 ring-white/15 transition group-hover:bg-white/15">
            <Building2 className="h-5 w-5 text-white" />
          </span>
          <span className="text-lg font-bold tracking-tight">សមាគមន៏សន្សំ</span>
        </Link>
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
  hint,
  children,
}: {
  label: string
  htmlFor: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={htmlFor} className="text-sm font-semibold text-foreground">
          {label}
        </label>
        {hint && <span className="text-xs text-muted">{hint}</span>}
      </div>
      {children}
    </div>
  )
}
