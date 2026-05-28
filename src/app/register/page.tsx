'use client'

import React, { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  CheckCircle2,
  CreditCard,
  Eye,
  EyeOff,
  FileText,
  Lock,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Sparkles,
  Upload,
  User,
  UserCheck,
  X,
} from 'lucide-react'
import { registerMember } from '@/app/actions/member'

type StepId = 1 | 2 | 3 | 4 | 5

interface StepDefinition {
  id: StepId
  label: string
  description: string
  hint: string
}

const STEPS: StepDefinition[] = [
  {
    id: 1,
    label: 'Account',
    description: 'Email & password',
    hint: 'Set the credentials you will use to sign in to your member portal.',
  },
  {
    id: 2,
    label: 'Personal',
    description: 'Identity details',
    hint: 'We verify your identity to keep cooperative funds and members safe.',
  },
  {
    id: 3,
    label: 'Referee',
    description: 'Vouching member',
    hint: 'An existing member can vouch for you to speed up approval.',
  },
  {
    id: 4,
    label: 'Documents',
    description: 'ID & resident book',
    hint: 'Clear photos help us approve your application faster.',
  },
  {
    id: 5,
    label: 'Done',
    description: 'Submitted',
    hint: 'Your application is in. We will notify you when it is reviewed.',
  },
]

interface FormData {
  email: string
  password: string
  confirmPassword: string
  full_name: string
  phone: string
  address: string
  id_number: string
  resident_book_number: string
  referee_email: string
  id_document: File | null
  resident_book: File | null
}

const INITIAL_FORM: FormData = {
  email: '',
  password: '',
  confirmPassword: '',
  full_name: '',
  phone: '',
  address: '',
  id_number: '',
  resident_book_number: '',
  referee_email: '',
  id_document: null,
  resident_book: null,
}

export default function RegisterPage() {
  const [step, setStep] = useState<StepId>(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM)

  const updateField = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const currentStep = STEPS[step - 1]
  const totalSteps = 4
  const progress = step <= totalSteps ? Math.round(((step - 1) / totalSteps) * 100) : 100

  const passwordStrength = useMemo(() => {
    const pwd = formData.password
    if (!pwd) return { score: 0, label: '', tone: 'bg-slate-200' }
    let score = 0
    if (pwd.length >= 8) score += 1
    if (/[A-Z]/.test(pwd)) score += 1
    if (/[0-9]/.test(pwd)) score += 1
    if (/[^A-Za-z0-9]/.test(pwd)) score += 1
    const map = [
      { label: 'Too weak', tone: 'bg-rose-500' },
      { label: 'Weak', tone: 'bg-orange-500' },
      { label: 'Fair', tone: 'bg-amber-500' },
      { label: 'Strong', tone: 'bg-emerald-500' },
      { label: 'Excellent', tone: 'bg-emerald-600' },
    ]
    return { score, ...map[score] }
  }, [formData.password])

  const validateStep1 = () => {
    if (!formData.email || !formData.password || !formData.confirmPassword) {
      setError('Please fill in your email and password.')
      return false
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Please enter a valid email address.')
      return false
    }
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long.')
      return false
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.')
      return false
    }
    return true
  }

  const validateStep2 = () => {
    if (!formData.full_name || !formData.phone || !formData.id_number) {
      setError('Please fill in your full name, phone number, and ID number.')
      return false
    }
    return true
  }

  const handleNext = () => {
    setError(null)
    if (step === 1 && !validateStep1()) return
    if (step === 2 && !validateStep2()) return
    setStep((prev) => Math.min(prev + 1, 5) as StepId)
  }

  const handleBack = () => {
    setError(null)
    setStep((prev) => Math.max(prev - 1, 1) as StepId)
  }

  const handleSubmit = async () => {
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const payload = new FormData()
      Object.entries(formData).forEach(([key, value]) => {
        if (value) payload.append(key, value)
      })

      const result = await registerMember(payload)
      if (!result.success) {
        setError(result.error ?? 'Registration failed. Please try again.')
        return
      }

      setStep(5)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Registration failed. Please try again.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto grid min-h-screen w-full max-w-[1400px] grid-cols-1 lg:grid-cols-[440px_1fr]">
        <BrandPanel currentStep={step} />

        <main className="relative flex min-h-screen flex-col bg-slate-50">
          <header className="flex items-center justify-between border-b border-slate-200 bg-white/80 px-4 py-4 backdrop-blur-sm sm:px-8 lg:hidden">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-lg font-bold text-blue-950"
            >
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-blue-950 text-white">
                <Building2 className="h-5 w-5" />
              </span>
              SanSam
            </Link>
            <Link
              href="/login"
              className="text-sm font-semibold text-blue-900 hover:text-blue-700"
            >
              Sign in
            </Link>
          </header>

          <div className="hidden items-center justify-end border-b border-slate-200 bg-white/60 px-8 py-5 backdrop-blur-sm lg:flex">
            <span className="mr-4 text-sm text-slate-500">Already a member?</span>
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-blue-900 transition hover:border-blue-200 hover:text-blue-700"
            >
              Sign in
            </Link>
          </div>

          <div className="flex flex-1 flex-col px-4 py-8 sm:px-8 lg:px-12 lg:py-12">
            <div className="mx-auto w-full max-w-2xl">
              <MobileStepBar step={step} />

              <div className="mb-7">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">
                  {step === 5 ? 'Complete' : `Step ${step} of ${totalSteps}`}
                </p>
                <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 sm:text-[34px]">
                  {step === 5 ? 'Application submitted' : currentStep.label}
                </h1>
                <p className="mt-2 text-[15px] leading-6 text-slate-600">{currentStep.hint}</p>
              </div>

              {step < 5 && (
                <div className="mb-6">
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full bg-linear-to-r from-blue-600 to-blue-900 transition-all duration-500 ease-out"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}

              {error && (
                <div
                  role="alert"
                  className="mb-6 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-800"
                >
                  <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                  <p className="text-sm leading-6">{error}</p>
                </div>
              )}

              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/40 sm:p-8">
                {step === 1 && (
                  <StepAccount
                    formData={formData}
                    updateField={updateField}
                    showPassword={showPassword}
                    setShowPassword={setShowPassword}
                    showConfirmPassword={showConfirmPassword}
                    setShowConfirmPassword={setShowConfirmPassword}
                    strength={passwordStrength}
                  />
                )}
                {step === 2 && <StepPersonal formData={formData} updateField={updateField} />}
                {step === 3 && <StepReferee formData={formData} updateField={updateField} />}
                {step === 4 && <StepDocuments formData={formData} updateField={updateField} />}
                {step === 5 && <StepSuccess />}
              </div>

              {step < 5 && (
                <div className="mt-6 flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <button
                    type="button"
                    onClick={handleBack}
                    disabled={loading || step === 1}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back
                  </button>

                  {step < totalSteps ? (
                    <button
                      type="button"
                      onClick={handleNext}
                      disabled={loading}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-950 px-6 py-3 text-sm font-semibold text-white shadow-sm shadow-blue-950/10 transition hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Continue
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={loading}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-950 px-6 py-3 text-sm font-semibold text-white shadow-sm shadow-blue-950/10 transition hover:bg-blue-900 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {loading ? (
                        <>
                          <svg
                            className="h-4 w-4 animate-spin"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            />
                          </svg>
                          Submitting...
                        </>
                      ) : (
                        <>
                          Submit application
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </button>
                  )}
                </div>
              )}

              <p className="mt-8 text-center text-xs text-slate-400 sm:text-left">
                By continuing, you agree that the information you provide is accurate and consent
                to SanSam reviewing your documents for membership approval.
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

function BrandPanel({ currentStep }: { currentStep: StepId }) {
  return (
    <aside className="relative hidden overflow-hidden bg-blue-950 text-white lg:flex lg:flex-col">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(96,165,250,0.25),transparent_45%)]" />
      <div className="absolute inset-x-0 bottom-0 h-72 bg-[radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.28),transparent_55%)]" />

      <div className="relative flex h-full flex-col px-10 py-10">
        <Link href="/" className="inline-flex w-fit items-center gap-2.5 group">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/10 ring-1 ring-white/15 transition group-hover:bg-white/15">
            <Building2 className="h-5 w-5 text-white" />
          </span>
          <span className="text-lg font-bold tracking-tight">SanSam Cooperative</span>
        </Link>

        <div className="mt-14">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-100 ring-1 ring-white/15">
            <Sparkles className="h-3.5 w-3.5" />
            New member onboarding
          </span>
          <h2 className="mt-5 text-[28px] font-bold leading-[1.2]">
            Join a trusted member-owned community.
          </h2>
          <p className="mt-3 text-[15px] leading-7 text-blue-100/85">
            Complete four short steps to open your account, then save fairly,
            request transparent loans, and grow with members like you.
          </p>
        </div>

        <ol className="mt-10 space-y-2.5">
          {STEPS.slice(0, 4).map((step) => {
            const isComplete = currentStep > step.id
            const isCurrent = currentStep === step.id
            return (
              <li
                key={step.id}
                className={`flex items-start gap-4 rounded-2xl px-4 py-3 transition-colors ${
                  isCurrent
                    ? 'bg-white/10 ring-1 ring-white/20'
                    : isComplete
                    ? 'bg-white/4'
                    : ''
                }`}
              >
                <span
                  className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-semibold transition-all ${
                    isComplete
                      ? 'bg-emerald-400 text-emerald-950'
                      : isCurrent
                      ? 'bg-white text-blue-950 ring-4 ring-white/15'
                      : 'bg-white/10 text-blue-100 ring-1 ring-white/15'
                  }`}
                >
                  {isComplete ? <Check className="h-4 w-4" /> : step.id}
                </span>
                <div>
                  <p
                    className={`text-sm font-semibold ${
                      isCurrent ? 'text-white' : 'text-blue-50'
                    }`}
                  >
                    {step.label}
                  </p>
                  <p className="mt-0.5 text-xs leading-5 text-blue-200/80">{step.description}</p>
                </div>
              </li>
            )
          })}
        </ol>

        <div className="mt-auto pt-10">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-blue-100">
              <ShieldCheck className="h-5 w-5" />
              <p className="text-sm font-semibold">Your data is protected</p>
            </div>
            <p className="mt-2 text-xs leading-5 text-blue-200/85">
              Documents are stored privately and only reviewed by approved SanSam admins.
              Approval typically takes 1-3 business days.
            </p>
          </div>
        </div>
      </div>
    </aside>
  )
}

function MobileStepBar({ step }: { step: StepId }) {
  return (
    <div className="mb-8 flex items-center gap-1.5 lg:hidden">
      {STEPS.slice(0, 4).map((s) => {
        const isComplete = step > s.id
        const isCurrent = step === s.id
        return (
          <div
            key={s.id}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              isComplete || isCurrent ? 'bg-blue-900' : 'bg-slate-200'
            }`}
          />
        )
      })}
    </div>
  )
}

interface FieldShellProps {
  label: string
  htmlFor: string
  hint?: string
  optional?: boolean
  children: React.ReactNode
}

function Field({ label, htmlFor, hint, optional, children }: FieldShellProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={htmlFor} className="text-sm font-semibold text-slate-800">
          {label}
          {optional && (
            <span className="ml-1.5 text-xs font-normal text-slate-400">(optional)</span>
          )}
        </label>
        {hint && <span className="text-xs text-slate-400">{hint}</span>}
      </div>
      {children}
    </div>
  )
}

const inputBase =
  'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-[15px] text-slate-900 shadow-xs outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15'

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
        className={`${inputBase} pl-11 ${trailing ? 'pr-11' : ''} ${className}`}
      />
      {trailing && (
        <div className="absolute right-2 top-1/2 -translate-y-1/2">{trailing}</div>
      )}
    </div>
  )
}

interface StepProps {
  formData: FormData
  updateField: <K extends keyof FormData>(field: K, value: FormData[K]) => void
}

interface StepAccountProps extends StepProps {
  showPassword: boolean
  setShowPassword: (v: boolean) => void
  showConfirmPassword: boolean
  setShowConfirmPassword: (v: boolean) => void
  strength: { score: number; label: string; tone: string }
}

function StepAccount({
  formData,
  updateField,
  showPassword,
  setShowPassword,
  showConfirmPassword,
  setShowConfirmPassword,
  strength,
}: StepAccountProps) {
  return (
    <div className="space-y-6">
      <Field label="Email address" htmlFor="email">
        <IconInput
          id="email"
          icon={<Mail className="h-4.5 w-4.5" />}
          type="email"
          autoComplete="email"
          value={formData.email}
          onChange={(e) => updateField('email', e.target.value)}
          placeholder="you@example.com"
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Password" htmlFor="password" hint="Min 8 characters">
          <IconInput
            id="password"
            icon={<Lock className="h-4.5 w-4.5" />}
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            value={formData.password}
            onChange={(e) => updateField('password', e.target.value)}
            placeholder="Create a password"
            trailing={
              <button
                type="button"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                onClick={() => setShowPassword(!showPassword)}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            }
          />
        </Field>

        <Field label="Confirm password" htmlFor="confirmPassword">
          <IconInput
            id="confirmPassword"
            icon={<Lock className="h-4.5 w-4.5" />}
            type={showConfirmPassword ? 'text' : 'password'}
            autoComplete="new-password"
            value={formData.confirmPassword}
            onChange={(e) => updateField('confirmPassword', e.target.value)}
            placeholder="Re-enter password"
            trailing={
              <button
                type="button"
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            }
          />
        </Field>
      </div>

      {formData.password && (
        <div className="space-y-2">
          <div className="flex gap-1.5">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  i < strength.score ? strength.tone : 'bg-slate-200'
                }`}
              />
            ))}
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">Password strength</span>
            <span className="font-semibold text-slate-700">{strength.label}</span>
          </div>
        </div>
      )}

      <div className="flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50/60 p-4 text-sm leading-6 text-blue-900">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-blue-700" />
        <p>
          Use a strong, unique password. Your account secures your savings, loan requests,
          repayments, and reports.
        </p>
      </div>
    </div>
  )
}

function StepPersonal({ formData, updateField }: StepProps) {
  return (
    <div className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Full name" htmlFor="full_name" hint="As shown on ID">
          <IconInput
            id="full_name"
            icon={<User className="h-4.5 w-4.5" />}
            type="text"
            autoComplete="name"
            value={formData.full_name}
            onChange={(e) => updateField('full_name', e.target.value)}
            placeholder="Your full legal name"
          />
        </Field>
        <Field label="Phone number" htmlFor="phone">
          <IconInput
            id="phone"
            icon={<Phone className="h-4.5 w-4.5" />}
            type="tel"
            autoComplete="tel"
            value={formData.phone}
            onChange={(e) => updateField('phone', e.target.value)}
            placeholder="0812345678"
          />
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="ID card number" htmlFor="id_number">
          <IconInput
            id="id_number"
            icon={<CreditCard className="h-4.5 w-4.5" />}
            type="text"
            inputMode="numeric"
            value={formData.id_number}
            onChange={(e) => updateField('id_number', e.target.value)}
            placeholder="13-digit ID number"
          />
        </Field>
        <Field label="Resident book number" htmlFor="resident_book_number" optional>
          <IconInput
            id="resident_book_number"
            icon={<FileText className="h-4.5 w-4.5" />}
            type="text"
            value={formData.resident_book_number}
            onChange={(e) => updateField('resident_book_number', e.target.value)}
            placeholder="Book number"
          />
        </Field>
      </div>

      <Field label="Address" htmlFor="address" optional>
        <div className="relative">
          <MapPin className="pointer-events-none absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-400" />
          <textarea
            id="address"
            value={formData.address}
            onChange={(e) => updateField('address', e.target.value)}
            placeholder="Your current address"
            rows={3}
            className={`${inputBase} resize-none pl-11`}
          />
        </div>
      </Field>
    </div>
  )
}

function StepReferee({ formData, updateField }: StepProps) {
  return (
    <div className="space-y-5">
      <div className="overflow-hidden rounded-2xl border border-blue-100 bg-blue-50/60">
        <div className="flex items-start gap-3 p-5">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-blue-700 ring-1 ring-blue-100">
            <UserCheck className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-semibold text-blue-950">Why we ask for a referee</p>
            <p className="mt-1 text-[13px] leading-6 text-blue-900/80">
              A referee is an existing SanSam member who vouches for your application. They
              receive a verification request by email and confirm that they know you. You can
              skip this step and add one later.
            </p>
          </div>
        </div>
      </div>

      <Field
        label="Referee email address"
        htmlFor="referee_email"
        optional
        hint="Must be an active member"
      >
        <IconInput
          id="referee_email"
          icon={<Mail className="h-4.5 w-4.5" />}
          type="email"
          autoComplete="off"
          value={formData.referee_email}
          onChange={(e) => updateField('referee_email', e.target.value)}
          placeholder="referee@example.com"
        />
      </Field>

      <p className="text-xs leading-5 text-slate-500">
        Tip: Ask a colleague, family member, or friend who is already a SanSam member. If you do
        not have a referee yet, contact a SanSam administrator after registering.
      </p>
    </div>
  )
}

function StepDocuments({ formData, updateField }: StepProps) {
  return (
    <div className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <FileUpload
          label="ID card"
          subtitle="Front & back side"
          file={formData.id_document}
          onChange={(file) => updateField('id_document', file)}
          accept="image/*,.pdf"
        />
        <FileUpload
          label="Resident book"
          subtitle="Tabien Baan"
          file={formData.resident_book}
          onChange={(file) => updateField('resident_book', file)}
          accept="image/*,.pdf"
        />
      </div>

      <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-5 text-sm text-amber-900">
        <p className="font-semibold">Before submitting</p>
        <ul className="mt-2.5 space-y-1.5 text-[13px] leading-6 text-amber-800">
          {[
            'Photos must be clear, well-lit, and readable',
            'Documents must be valid and not expired',
            'Accepted formats: JPG, PNG, or PDF (max 10MB each)',
            'Approval typically takes 1-3 business days',
          ].map((item) => (
            <li key={item} className="flex items-start gap-2">
              <span className="mt-2 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

interface FileUploadProps {
  label: string
  subtitle: string
  file: File | null
  onChange: (file: File | null) => void
  accept: string
}

function FileUpload({ label, subtitle, file, onChange, accept }: FileUploadProps) {
  return (
    <div className="space-y-2">
      <div>
        <p className="text-sm font-semibold text-slate-800">{label}</p>
        <p className="text-xs text-slate-500">{subtitle}</p>
      </div>

      {file ? (
        <div className="flex items-center gap-3 rounded-2xl border border-blue-200 bg-blue-50/60 px-4 py-3.5">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-blue-700 ring-1 ring-blue-100">
            <FileText className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-blue-950">{file.name}</p>
            <p className="text-xs text-blue-800/80">{formatBytes(file.size)}</p>
          </div>
          <button
            type="button"
            aria-label="Remove file"
            onClick={() => onChange(null)}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-slate-500 transition hover:bg-white hover:text-rose-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <label className="group flex h-32 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/60 px-4 transition hover:border-blue-300 hover:bg-blue-50/40">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-white text-slate-500 ring-1 ring-slate-200 transition group-hover:text-blue-700 group-hover:ring-blue-200">
            <Upload className="h-5 w-5" />
          </span>
          <span className="text-sm font-semibold text-slate-700">Click to upload</span>
          <span className="text-xs text-slate-500">JPG, PNG or PDF · up to 10MB</span>
          <input
            type="file"
            accept={accept}
            className="hidden"
            onChange={(e) => onChange(e.target.files?.[0] ?? null)}
          />
        </label>
      )}
    </div>
  )
}

function StepSuccess() {
  return (
    <div className="py-4 text-center">
      <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-emerald-100 ring-8 ring-emerald-50">
        <CheckCircle2 className="h-10 w-10 text-emerald-600" />
      </div>
      <h2 className="mt-6 text-2xl font-bold text-slate-950">Thanks — we have your application</h2>
      <p className="mx-auto mt-3 max-w-md text-[15px] leading-7 text-slate-600">
        Our team will review your documents within{' '}
        <strong className="text-slate-900">1-3 business days</strong>. You will receive a
        notification as soon as your account is approved.
      </p>

      <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50/70 p-5 text-left">
        <p className="text-sm font-semibold text-slate-900">What happens next</p>
        <ol className="mt-3 space-y-3">
          {[
            'Admin reviews your ID and resident book documents',
            'Referee receives a verification request (if provided)',
            'Account is approved and activated',
            'Sign in and start saving with SanSam',
          ].map((item, i) => (
            <li key={item} className="flex items-start gap-3">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-blue-950 text-xs font-semibold text-white">
                {i + 1}
              </span>
              <p className="text-sm leading-6 text-slate-700">{item}</p>
            </li>
          ))}
        </ol>
      </div>

      <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row">
        <Link
          href="/login"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-900"
        >
          Go to sign in
        </Link>
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
        >
          Back to home
        </Link>
      </div>
    </div>
  )
}

function formatBytes(bytes: number) {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`
}
