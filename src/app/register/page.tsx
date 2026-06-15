'use client'

import React, { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Calendar,
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
  Send,
  ShieldCheck,
  Upload,
  User,
  UserCheck,
  X,
} from 'lucide-react'
import { registerMember, checkTelegramConnected } from '@/app/actions/member'
import { LoadingDots, LoadingSpinner } from '@/components/ui/Loading'
import { showError } from '@/lib/toast'

type StepId = 1 | 2 | 3 | 4 | 5 | 6

interface StepDefinition {
  id: StepId
  label: string
  description: string
  hint: string
}

const STEPS: StepDefinition[] = [
  {
    id: 1,
    label: 'គណនី',
    description: 'អ៊ីមែល និង ពាក្យសម្ងាត់',
    hint: 'កំណត់ព័ត៌មានបញ្ជាក់ដែលអ្នកនឹងប្រើដើម្បីចូលវិបផតថលសមាជិករបស់អ្នក។',
  },
  {
    id: 2,
    label: 'ព័ត៌មានផ្ទាល់ខ្លួន',
    description: 'ព័ត៌មានអត្តសញ្ញាណ',
    hint: 'យើងផ្ទៀងផ្ទាត់អត្តសញ្ញាណរបស់អ្នកដើម្បីរក្សាសុវត្ថិភាពនៃមូលនិធិសហករណ៍ និង សមាជិក។',
  },
  {
    id: 3,
    label: 'អ្នកធានា',
    description: 'សមាជិកធានា',
    hint: 'សមាជិកដែលមានស្រាប់អាចធានាជូនអ្នកដើម្បីបង្កើនល្បឿនការទទួល។',
  },
  {
    id: 4,
    label: 'ឯកសារ',
    description: 'អត្តសញ្ញាណប័ណ្ណ និង សៀវភៅគ្រួសារ',
    hint: 'រូបថតច្បាស់ៗជួយយើងទទួលពាក្យសុំរបស់អ្នកលឿនជាងមុន។',
  },
  {
    id: 5,
    label: 'ភ្ជាប់តេលេក្រាម',
    description: 'ទទួលការជូនដំណឹង',
    hint: 'ភ្ជាប់តេលេក្រាមដើម្បីទទួលបានការជូនដំណឹងភ្លាមៗ នៅពេលគណនី ការសន្សំ និង កម្ជីរបស់អ្នកមានការផ្លាស់ប្តូរ។',
  },
  {
    id: 6,
    label: 'រួចរាល់',
    description: 'បានដាក់ស្នើរួចហើយ',
    hint: 'ពាក្យសុំរបស់អ្នកត្រូវបានដាក់ស្នើ។ យើងនឹងជូនដំណឹងអ្នកនៅពេលដែលត្រូវបានត្រួតពិនិត្យ។',
  },
]

interface FormData {
  email: string
  password: string
  confirmPassword: string
  full_name_kh: string
  full_name_en: string
  phone: string
  date_of_birth: string
  address: string
  id_number: string
  resident_book_number: string
  referee_name_kh: string
  referee_name_en: string
  referee_phone: string
  referee_email: string
  id_document: File | null
  resident_book: File | null
}

const INITIAL_FORM: FormData = {
  email: '',
  password: '',
  confirmPassword: '',
  full_name_kh: '',
  full_name_en: '',
  phone: '',
  date_of_birth: '',
  address: '',
  id_number: '',
  resident_book_number: '',
  referee_name_kh: '',
  referee_name_en: '',
  referee_phone: '',
  referee_email: '',
  id_document: null,
  resident_book: null,
}

/** Keeps every text field a string so inputs stay controlled (e.g. after HMR or field renames). */
function normalizeFormData(data: Partial<FormData> & { full_name?: string }): FormData {
  const merged = { ...INITIAL_FORM, ...data }
  return {
    ...merged,
    email: merged.email ?? '',
    password: merged.password ?? '',
    confirmPassword: merged.confirmPassword ?? '',
    full_name_kh: merged.full_name_kh ?? data.full_name ?? '',
    full_name_en: merged.full_name_en ?? '',
    phone: merged.phone ?? '',
    date_of_birth: merged.date_of_birth ?? '',
    address: merged.address ?? '',
    id_number: merged.id_number ?? '',
    resident_book_number: merged.resident_book_number ?? '',
    referee_name_kh: merged.referee_name_kh ?? '',
    referee_name_en: merged.referee_name_en ?? '',
    referee_phone: merged.referee_phone ?? '',
    referee_email: merged.referee_email ?? '',
    id_document: merged.id_document ?? null,
    resident_book: merged.resident_book ?? null,
  }
}

export default function RegisterPage() {
  const [step, setStep] = useState<StepId>(1)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [connectToken, setConnectToken] = useState<string | null>(null)
  const [formData, setFormData] = useState<FormData>(() => normalizeFormData(INITIAL_FORM))

  const updateField = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData((prev) => normalizeFormData({ ...prev, [field]: value }))
  }

  useEffect(() => {
    setFormData((prev) => normalizeFormData(prev))
  }, [])

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
      { label: 'ខ្សោយណាស់', tone: 'bg-rose-500' },
      { label: 'ខ្សោយ', tone: 'bg-orange-500' },
      { label: 'មធ្យម', tone: 'bg-amber-500' },
      { label: 'រឹងមាំ', tone: 'bg-emerald-500' },
      { label: 'ល្អបំផុត', tone: 'bg-emerald-600' },
    ]
    return { score, ...map[score] }
  }, [formData.password])

  const validateStep1 = () => {
    if (!formData.email || !formData.password || !formData.confirmPassword) {
      showError('សូមបំពេញអ៊ីមែល និង ពាក្យសម្ងាត់របស់អ្នក។')
      return false
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      showError('សូមបញ្ចូលអាសយដ្ឋានអ៊ីមែលត្រឹមត្រូវ។')
      return false
    }
    if (formData.password.length < 8) {
      showError('ពាក្យសម្ងាត់ត្រូវមានយ៉ាងតិច ៨ តួអក្សរ។')
      return false
    }
    if (formData.password !== formData.confirmPassword) {
      showError('ពាក្យសម្ងាត់មិនត្រូវគ្នាទេ។')
      return false
    }
    return true
  }

  const validateStep2 = () => {
    if (
      !formData.full_name_kh ||
      !formData.full_name_en ||
      !formData.phone ||
      !formData.date_of_birth ||
      !formData.id_number
    ) {
      showError(
        'សូមបំពេញឈ្មោះ (ខ្មែរ និង អង់គ្លេស) ថ្ងៃខែឆ្នាំកំណើត លេខទូរស័ព្ទ និង លេខអត្តសញ្ញាណប័ណ្ណ។'
      )
      return false
    }
    if (formData.date_of_birth > new Date().toISOString().slice(0, 10)) {
      showError('ថ្ងៃខែឆ្នាំកំណើតមិនអាចនៅពេលអនាគតបានទេ។')
      return false
    }
    if (!/^\d{9}$/.test(formData.id_number)) {
      showError('លេខអត្តសញ្ញាណប័ណ្ណត្រូវមាន ៩ ខ្ទង់។')
      return false
    }
    return true
  }

  const handleNext = () => {
    if (step === 1 && !validateStep1()) return
    if (step === 2 && !validateStep2()) return
    setStep((prev) => Math.min(prev + 1, 5) as StepId)
  }

  const handleBack = () => {
    setStep((prev) => Math.max(prev - 1, 1) as StepId)
  }

  const handleSubmit = async () => {
    if (formData.password !== formData.confirmPassword) {
      showError('ពាក្យសម្ងាត់មិនត្រូវគ្នាទេ។')
      return
    }

    setLoading(true)

    try {
      const payload = new FormData()
      Object.entries(formData).forEach(([key, value]) => {
        if (value) payload.append(key, value)
      })

      const result = await registerMember(payload)
      if (!result.success) {
        showError(result.error ?? 'ការចុះឈ្មោះបរាជ័យ។ សូមព្យាយាមម្តងទៀត។')
        return
      }

      setConnectToken(result.connectToken ?? null)
      setStep(5)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'ការចុះឈ្មោះបរាជ័យ។ សូមព្យាយាមម្តងទៀត។'
      showError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto grid min-h-screen w-full max-w-[1400px] grid-cols-1 lg:grid-cols-[440px_1fr]">
        <BrandPanel currentStep={step} />

        <main className="relative flex min-h-screen flex-col bg-background">
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
              href="/login"
              className="text-sm font-semibold text-brand-900 hover:text-brand-700"
            >
              ចូលគណនី
            </Link>
          </header>

          <div className="hidden items-center justify-end border-b border-slate-200 bg-white/60 px-8 py-5 backdrop-blur-sm lg:flex">
            <span className="mr-4 text-sm text-slate-500">ជាសមាជិករួចហើយ?</span>
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-brand-900 transition hover:border-brand-200 hover:text-brand-700"
            >
              ចូលគណនី
            </Link>
          </div>

          <div className="flex flex-1 flex-col px-4 py-8 sm:px-8 lg:px-12 lg:py-12">
            <div className="mx-auto w-full max-w-2xl">
              <MobileStepBar step={step} />

              <div className="mb-7">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
                  {step >= 5 ? currentStep.label : `ជំហានទី ${step} នៃ ${totalSteps}`}
                </p>
                <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 sm:text-[34px]">
                  {step === 6 ? 'ពាក្យសុំត្រូវបានដាក់ស្នើ' : currentStep.label}
                </h1>
                <p className="mt-2 text-[15px] leading-6 text-slate-600">{currentStep.hint}</p>
              </div>

              {step < 5 && (
                <div className="mb-6">
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full bg-brand-800 transition-all duration-500 ease-out"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="rounded-3xl border border-border bg-surface p-6 shadow-sm shadow-slate-200/40 sm:p-8">
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
                {step === 5 && (
                  <StepTelegram connectToken={connectToken} onDone={() => setStep(6)} />
                )}
                {step === 6 && <StepSuccess />}
              </div>

              {step < 5 && (
                <div className="mt-6 flex flex-col-reverse items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <button
                    type="button"
                    onClick={handleBack}
                    disabled={loading || step === 1}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-background disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    ត្រឡប់ក្រោយ
                  </button>

                  {step < totalSteps ? (
                    <button
                      type="button"
                      onClick={handleNext}
                      disabled={loading}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-950 px-6 py-3 text-sm font-semibold text-white shadow-sm shadow-brand-950/10 transition hover:bg-brand-950 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      បន្ត
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={loading}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-950 px-6 py-3 text-sm font-semibold text-white shadow-sm shadow-brand-950/10 transition hover:bg-brand-950 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {loading ? (
                        <>
                          <LoadingSpinner size="sm" color="white" />
                          កំពុងដាក់ស្នើ...
                        </>
                      ) : (
                        <>
                          ដាក់ស្នើពាក្យសុំ
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </button>
                  )}
                </div>
              )}

              <p className="mt-8 text-center text-xs text-slate-400 sm:text-left">
                ដោយការបន្ត អ្នកយល់ព្រមថាព័ត៌មានដែលអ្នកផ្តល់គឺត្រឹមត្រូវ និង យល់ព្រមឱ្យសន្សំ
                ត្រួតពិនិត្យឯកសាររបស់អ្នកសម្រាប់ការទទួលចូលជាសមាជិក។
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
            ចូលរួមសហគមន៍ដែលគ្រប់គ្រងដោយសមាជិកដែលអាចទុកចិត្តបាន។
          </h2>
          <p className="mt-3 text-[15px] leading-7 text-brand-100/85">
            បំពេញជំហានខ្លីៗបួនដើម្បីបើកគណនី។
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
                      ? 'bg-white text-brand-950 ring-4 ring-white/15'
                      : 'bg-white/10 text-brand-100 ring-1 ring-white/15'
                  }`}
                >
                  {isComplete ? <Check className="h-4 w-4" /> : step.id}
                </span>
                <div>
                  <p
                    className={`text-sm font-semibold ${
                      isCurrent ? 'text-white' : 'text-brand-50'
                    }`}
                  >
                    {step.label}
                  </p>
                  <p className="mt-0.5 text-xs leading-5 text-brand-200/80">{step.description}</p>
                </div>
              </li>
            )
          })}
        </ol>

        <div className="mt-auto pt-10">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-brand-100">
              <ShieldCheck className="h-5 w-5" />
              <p className="text-sm font-semibold">ទិន្នន័យរបស់អ្នកត្រូវបានការពារ</p>
            </div>
            <p className="mt-2 text-xs leading-5 text-brand-200/85">
              ឯកសារត្រូវបានរក្សាទុកដោយឯកជន និង ត្រួតពិនិត្យតែដោយអ្នកគ្រប់គ្រងសន្សំដែលបានទទួល។
              ការទទួលជាធម្មតាចំណាយពេល ១-៣ ថ្ងៃ។
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
              isComplete || isCurrent ? 'bg-brand-950' : 'bg-slate-200'
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
            <span className="ml-1.5 text-xs font-normal text-slate-400"></span>
          )}
        </label>
        {hint && <span className="text-xs text-slate-400">{hint}</span>}
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

function IconInput({ icon, trailing, className = '', value, ...rest }: IconInputProps) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
        {icon}
      </span>
      <input
        {...rest}
        value={value ?? ''}
        className={`${inputBase} app-input--with-icon ${trailing ? 'app-input--with-trailing' : ''} ${className}`}
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
      <Field label="អាសយដ្ឋានអ៊ីមែល" htmlFor="email">
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
        <Field label="ពាក្យសម្ងាត់" htmlFor="password" hint="យ៉ាងតិច ៨ តួអក្សរ">
          <IconInput
            id="password"
            icon={<Lock className="h-4.5 w-4.5" />}
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            value={formData.password}
            onChange={(e) => updateField('password', e.target.value)}
            placeholder="បង្កើតពាក្យសម្ងាត់"
            trailing={
              <button
                type="button"
                aria-label={showPassword ? 'លាក់ពាក្យសម្ងាត់' : 'បង្ហាញពាក្យសម្ងាត់'}
                onClick={() => setShowPassword(!showPassword)}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            }
          />
        </Field>

        <Field label="បញ្ជាក់ពាក្យសម្ងាត់" htmlFor="confirmPassword">
          <IconInput
            id="confirmPassword"
            icon={<Lock className="h-4.5 w-4.5" />}
            type={showConfirmPassword ? 'text' : 'password'}
            autoComplete="new-password"
            value={formData.confirmPassword}
            onChange={(e) => updateField('confirmPassword', e.target.value)}
            placeholder="បញ្ចូលពាក្យសម្ងាត់ម្តងទៀត"
            trailing={
              <button
                type="button"
                aria-label={showConfirmPassword ? 'លាក់ពាក្យសម្ងាត់' : 'បង្ហាញពាក្យសម្ងាត់'}
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
            <span className="text-slate-500">កម្លាំងពាក្យសម្ងាត់</span>
            <span className="font-semibold text-slate-700">{strength.label}</span>
          </div>
        </div>
      )}      
    </div>
  )
}

function StepPersonal({ formData, updateField }: StepProps) {
  return (
    <div className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="ឈ្មោះ (ខ្មែរ)" htmlFor="full_name_kh" hint="ដូចនៅលើអត្តសញ្ញាណប័ណ្ណ">
          <IconInput
            id="full_name_kh"
            icon={<User className="h-4.5 w-4.5" />}
            type="text"
            autoComplete="name"
            value={formData.full_name_kh}
            onChange={(e) => updateField('full_name_kh', e.target.value)}
            placeholder="ឈ្មោះជាអក្សរខ្មែរ"
          />
        </Field>
        <Field label="ឈ្មោះ (អង់គ្លេស)" htmlFor="full_name_en" hint="ដូចនៅលើអត្តសញ្ញាណប័ណ្ណ">
          <IconInput
            id="full_name_en"
            icon={<User className="h-4.5 w-4.5" />}
            type="text"
            autoComplete="additional-name"
            value={formData.full_name_en}
            onChange={(e) => updateField('full_name_en', e.target.value)}
            placeholder="Full name in English"
          />
        </Field>
        <Field label="លេខទូរស័ព្ទ" htmlFor="phone">
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
        <Field label="ថ្ងៃខែឆ្នាំកំណើត" htmlFor="date_of_birth" hint="ដូចនៅលើអត្តសញ្ញាណប័ណ្ណ">
          <IconInput
            id="date_of_birth"
            icon={<Calendar className="h-4.5 w-4.5" />}
            type="date"
            autoComplete="bday"
            value={formData.date_of_birth}
            max={new Date().toISOString().slice(0, 10)}
            onChange={(e) => updateField('date_of_birth', e.target.value)}
          />
        </Field>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="លេខអត្តសញ្ញាណប័ណ្ណ" htmlFor="id_number">
          <IconInput
            id="id_number"
            icon={<CreditCard className="h-4.5 w-4.5" />}
            type="text"
            inputMode="numeric"
            maxLength={9}
            value={formData.id_number}
            onChange={(e) => updateField('id_number', e.target.value.replace(/\D/g, '').slice(0, 9))}
            placeholder="លេខអត្តសញ្ញាណប័ណ្ណ ៩ ខ្ទង់"
          />
        </Field>
        <Field label="លេខសៀវភៅគ្រួសារ/លេខសៀវភៅស្នាក់នៅ" htmlFor="resident_book_number" optional>
          <IconInput
            id="resident_book_number"
            icon={<FileText className="h-4.5 w-4.5" />}
            type="text"
            value={formData.resident_book_number}
            onChange={(e) => updateField('resident_book_number', e.target.value)}
            placeholder="លេខសៀវភៅ"
          />
        </Field>
      </div>

      <Field label="អាសយដ្ឋាន" htmlFor="address" optional>
        <div className="relative">
          <MapPin className="pointer-events-none absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-400" />
          <textarea
            id="address"
            value={formData.address ?? ''}
            onChange={(e) => updateField('address', e.target.value)}
            placeholder="អាសយដ្ឋានបច្ចុប្បន្នរបស់អ្នក"
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
      <div className="overflow-hidden rounded-2xl border border-brand-100 bg-brand-50/60">
        <div className="flex items-start gap-3 p-5">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-brand-700 ring-1 ring-brand-100">
            <UserCheck className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-semibold text-brand-950">ហេតុអ្វីបានជាយើងសុំអ្នកធានា</p>
            <p className="mt-1 text-[13px] leading-6 text-brand-900/80">
              អ្នកធានាគឺជាសមាជិកសន្សំដែលមានស្រាប់ដែលធានាជូនពាក្យសុំរបស់អ្នក។ ពួកគេនឹង
              ទទួលបានសំណើផ្ទៀងផ្ទាត់តាមអ៊ីមែល និង បញ្ជាក់ថាពួកគេស្គាល់អ្នក។ អ្នកអាច
              រំលងជំហាននេះ និង បន្ថែមក្រោយ។
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="ឈ្មោះអ្នកធានា (ខ្មែរ)" htmlFor="referee_name_kh" optional>
          <IconInput
            id="referee_name_kh"
            icon={<User className="h-4.5 w-4.5" />}
            type="text"
            autoComplete="off"
            value={formData.referee_name_kh}
            onChange={(e) => updateField('referee_name_kh', e.target.value)}
            placeholder="ឈ្មោះជាអក្សរខ្មែរ"
          />
        </Field>
        <Field label="ឈ្មោះអ្នកធានា (អង់គ្លេស)" htmlFor="referee_name_en" optional>
          <IconInput
            id="referee_name_en"
            icon={<User className="h-4.5 w-4.5" />}
            type="text"
            autoComplete="off"
            value={formData.referee_name_en}
            onChange={(e) => updateField('referee_name_en', e.target.value)}
            placeholder="Full name in English"
          />
        </Field>
      </div>

      <Field label="លេខទូរស័ព្ទអ្នកធានា" htmlFor="referee_phone" optional>
        <IconInput
          id="referee_phone"
          icon={<Phone className="h-4.5 w-4.5" />}
          type="tel"
          autoComplete="off"
          value={formData.referee_phone}
          onChange={(e) => updateField('referee_phone', e.target.value)}
          placeholder="0812345678"
        />
      </Field>

      <Field
        label="អាសយដ្ឋានអ៊ីមែលអ្នកធានា"
        htmlFor="referee_email"
        optional
        hint="ត្រូវជាសមាជិកសកម្ម"
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
        គន្លឹះ៖ សុំសហការី សមាជិកគ្រួសារ ឬ មិត្តភក្តិដែលជាសមាជិកសន្សំរួចហើយ។ ប្រសិនបើ
        អ្នកមិនមានអ្នកធានា សូមទាក់ទងអ្នកគ្រប់គ្រងសន្សំបន្ទាប់ពីការចុះឈ្មោះ។
      </p>
    </div>
  )
}

function StepDocuments({ formData, updateField }: StepProps) {
  return (
    <div className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <FileUpload
          label="អត្តសញ្ញាណប័ណ្ណ"
          subtitle="ផ្នែកមុខ និង ផ្នែកក្រោយ"
          file={formData.id_document}
          onChange={(file) => updateField('id_document', file)}
          accept="image/*,.pdf"
        />
        <FileUpload
          label="សៀវភៅគ្រួសារ"
          subtitle="សៀវភៅស្នាក់នៅ"
          file={formData.resident_book}
          onChange={(file) => updateField('resident_book', file)}
          accept="image/*,.pdf"
        />
      </div>

      <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-5 text-sm text-amber-900">
        <p className="font-semibold">មុនពេលដាក់ស្នើ</p>
        <ul className="mt-2.5 space-y-1.5 text-[13px] leading-6 text-amber-800">
          {[
            'រូបថតត្រូវច្បាស់ មានពន្លឺល្អ និង អានបាន',
            'ឯកសារត្រូវមានសុពលភាព និង មិនផុតកំណត់',
            'ទម្រង់ទទួលយក៖ JPG, PNG ឬ PDF (អតិបរមា ១០ មេកាបៃក្នុងមួយឯកសារ)',
            'ការទទួលជាធម្មតាចំណាយពេល ១-៣ ថ្ងៃ',
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
        <div className="flex items-center gap-3 rounded-2xl border border-brand-200 bg-brand-50/60 px-4 py-3.5">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-brand-700 ring-1 ring-brand-100">
            <FileText className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-brand-950">{file.name}</p>
            <p className="text-xs text-brand-800/80">{formatBytes(file.size)}</p>
          </div>
          <button
            type="button"
            aria-label="លុបឯកសារ"
            onClick={() => onChange(null)}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-slate-500 transition hover:bg-white hover:text-rose-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <label className="group flex h-32 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-slate-200 bg-background/60 px-4 transition hover:border-brand-300 hover:bg-brand-50/40">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-white text-slate-500 ring-1 ring-slate-200 transition group-hover:text-brand-700 group-hover:ring-brand-200">
            <Upload className="h-5 w-5" />
          </span>
          <span className="text-sm font-semibold text-slate-700">ចុចដើម្បីផ្ទុក</span>
          <span className="text-xs text-slate-500">JPG, PNG ឬ PDF · រហូតដល់ ១០ មេកាបៃ</span>
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

interface StepTelegramProps {
  connectToken: string | null
  onDone: () => void
}

function StepTelegram({ connectToken, onDone }: StepTelegramProps) {
  const [connected, setConnected] = useState(false)
  const [checking, setChecking] = useState(true)
  const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME

  const deepLink =
    botUsername && connectToken
      ? `https://t.me/${botUsername}?start=${connectToken}`
      : null

  useEffect(() => {
    if (!connectToken) {
      setChecking(false)
      return
    }
    let active = true

    // Immediate check on mount — detects if the user already connected before landing here.
    checkTelegramConnected(connectToken)
      .then((isConnected) => {
        if (!active) return
        if (isConnected) setConnected(true)
      })
      .catch(() => {})
      .finally(() => {
        if (active) setChecking(false)
      })

    // Continue polling so we detect connections made after the page loads.
    const interval = setInterval(async () => {
      try {
        const isConnected = await checkTelegramConnected(connectToken)
        if (active && isConnected) {
          setConnected(true)
          clearInterval(interval)
        }
      } catch {
        // transient — keep polling
      }
    }, 3000)

    return () => {
      active = false
      clearInterval(interval)
    }
  }, [connectToken])

  if (checking) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="md" color="brand" />
      </div>
    )
  }

  if (connected) {
    return (
      <div className="py-4 text-center">
        <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-emerald-100 ring-8 ring-emerald-50">
          <CheckCircle2 className="h-10 w-10 text-emerald-600" />
        </div>
        <h2 className="mt-6 text-2xl font-bold text-slate-950">តេលេក្រាមត្រូវបានភ្ជាប់</h2>
        <p className="mx-auto mt-3 max-w-md text-[15px] leading-7 text-slate-600">
          អ្នកបានភ្ជាប់តេលេក្រាមជាមួយប៊ូតនេះរួចហើយ។ អ្នកនឹងទទួលបានការជូនដំណឹងពីសមាគមន៏សន្សំនៅពេលគណនីរបស់អ្នកមានការផ្លាស់ប្តូរ។
        </p>
        <button
          type="button"
          onClick={onDone}
          className="mt-8 inline-flex items-center justify-center gap-2 rounded-xl bg-brand-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-950"
        >
          បន្ត
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3 rounded-2xl border border-sky-100 bg-sky-50/70 p-5">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white text-sky-600 ring-1 ring-sky-100">
          <Send className="h-5 w-5" />
        </span>
        <div>
          <p className="text-sm font-semibold text-slate-900">ហេតុអ្វីបានជាភ្ជាប់តេលេក្រាម?</p>
          <p className="mt-1 text-[13px] leading-6 text-slate-600">
            យើងផ្ញើការជូនដំណឹងតាមតេលេក្រាមនៅពេលគណនីរបស់អ្នកត្រូវបានទទួល ការសន្សំត្រូវបានផ្ទៀងផ្ទាត់
            និង កម្ជីមានការផ្លាស់ប្តូរ។ បើកតេលេក្រាម ចុច <strong>Start</strong> រួចត្រឡប់មកទំព័រនេះវិញ។
          </p>
        </div>
      </div>

      {deepLink ? (
        <>
          <a
            href={deepLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#229ED9] px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1c8dc2]"
          >
            <Send className="h-4 w-4" />
            បើកតេលេក្រាម និង ភ្ជាប់
          </a>

          <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
            <LoadingDots size="sm" color="brand" />
            កំពុងរង់ចាំការភ្ជាប់... ទំព័រនេះនឹងធ្វើបច្ចុប្បន្នភាពដោយស្វ័យប្រវត្តិ។
          </div>

          <p className="text-center text-xs text-slate-400">
            ការភ្ជាប់តេលេក្រាមត្រូវបានទាមទារដើម្បីបញ្ចប់ការចុះឈ្មោះ។
          </p>
        </>
      ) : (
        <div className="rounded-xl border border-amber-200 bg-amber-50/70 px-4 py-3 text-[13px] leading-6 text-amber-800">
          តេលេក្រាមមិនទាន់ត្រូវបានកំណត់រចនាសម្ព័ន្ធនៅឡើយទេ។ សូមទាក់ទងអ្នកគ្រប់គ្រង។
        </div>
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
      <h2 className="mt-6 text-2xl font-bold text-slate-950">អរគុណ — យើងបានទទួលពាក្យសុំរបស់អ្នក</h2>
      <p className="mx-auto mt-3 max-w-md text-[15px] leading-7 text-slate-600">
        ក្រុមការងាររបស់យើងនឹងពិនិត្យឯកសាររបស់អ្នកក្នុងរយៈពេល{' '}
        <strong className="text-slate-900">១-៣ ថ្ងៃ</strong>។ អ្នកនឹងទទួលបាន
        ការជូនដំណឹងភ្លាមៗនៅពេលគណនីរបស់អ្នកត្រូវបានទទួល។
      </p>

      <div className="mt-8 rounded-2xl border border-slate-200 bg-background/70 p-5 text-left">
        <p className="text-sm font-semibold text-slate-900">តើនឹងមានអ្វីកើតឡើងបន្ទាប់?</p>
        <ol className="mt-3 space-y-3">
          {[
            'អ្នកគ្រប់គ្រងពិនិត្យអត្តសញ្ញាណប័ណ្ណ និង សៀវភៅគ្រួសាររបស់អ្នក',
            'អ្នកធានាទទួលបានសំណើផ្ទៀងផ្ទាត់ (ប្រសិនបើបានផ្តល់)',
            'គណនីត្រូវបានទទួល និង ដំណើរការ',
            'ចូលគណនី និង ចាប់ផ្តើមសន្សំជាមួយសន្សំ',
          ].map((item, i) => (
            <li key={item} className="flex items-start gap-3">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-950 text-xs font-semibold text-white">
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
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-950"
        >
          ចូលគណនី
        </Link>
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-background"
        >
          ត្រឡប់ទៅទំព័រដើម
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
