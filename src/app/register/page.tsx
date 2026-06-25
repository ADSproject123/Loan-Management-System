'use client'

import React, { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { CambodiaAddressSelect, formatCambodiaAddress, parseCambodiaAddress } from '@/components/ui/CambodiaAddressSelect'
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
  Phone,
  Plus,
  Search,
  Send,
  ShieldCheck,
  Trash2,
  Upload,
  User,
  UserCheck,
  X,
} from 'lucide-react'
import { registerMember, searchActiveMembers, type MemberSearchResult } from '@/app/actions/member'
import { TelegramConnectPanel } from '@/components/telegram/TelegramConnectPanel'
import { TelegramConnectSteps } from '@/components/telegram/TelegramConnectBanner'
import { WORKPLACE_OPTIONS } from '@/lib/workplace'
import { memberKhmerName } from '@/lib/memberNames'
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
    description: 'លេខទូរស័ព្ទ និង ពាក្យសម្ងាត់',
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
    label: 'មេគ្រុម',
    description: 'មេគ្រុមរបស់អ្នក',
    hint: 'មេគ្រុមដែលមានស្រាប់អាចផ្ទៀងផ្ទាត់ជូនអ្នកដើម្បីបង្កើនល្បឿនការទទួល។',
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

interface EmergencyContact {
  full_name: string
  phone: string
}

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
  workplace: string
  emergency_contacts: EmergencyContact[]
  referee_id: string
  referee_display_name: string
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
  workplace: '',
  emergency_contacts: [],
  referee_id: '',
  referee_display_name: '',
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
    workplace: merged.workplace ?? '',
    emergency_contacts: merged.emergency_contacts ?? [],
    referee_id: merged.referee_id ?? '',
    referee_display_name: merged.referee_display_name ?? '',
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
    if (!formData.phone || !formData.password || !formData.confirmPassword) {
      showError('សូមបំពេញលេខទូរស័ព្ទ និង ពាក្យសម្ងាត់របស់អ្នក។')
      return false
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
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
      !formData.date_of_birth ||
      !formData.id_number
    ) {
      showError(
        'សូមបំពេញឈ្មោះ (ខ្មែរ និង អង់គ្លេស) ថ្ងៃខែឆ្នាំកំណើត និង លេខអត្តសញ្ញាណប័ណ្ណ។'
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
        if (key === 'emergency_contacts') {
          payload.append(key, JSON.stringify(value))
        } else if (value) {
          payload.append(key, value as string | Blob)
        }
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
      <div className="min-h-screen w-full">
        <BrandPanel currentStep={step} />

        <main className="relative flex min-h-screen flex-col bg-background lg:ml-[30%]">
          <div className="flex items-center justify-between border-b border-border px-6 py-4 sm:px-8">
            <Link href="/" className="flex items-center gap-2 lg:hidden">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-950 text-white">
                <Building2 className="h-4 w-4" />
              </span>
              <span className="text-sm font-bold text-brand-950">សមាគមន៏សន្សំ</span>
            </Link>
            <span className="hidden lg:block" />
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted">ជាសមាជិករួចហើយ?</span>
              <Link
                href="/login"
                className="rounded-lg border border-border bg-surface px-3.5 py-2 text-sm font-semibold text-foreground transition hover:border-brand-200 hover:text-brand-700"
              >
                ចូលគណនី
              </Link>
            </div>
          </div>

          <div className="flex flex-1 flex-col px-4 py-8 sm:px-8 lg:px-12 lg:py-12">
            <div className="mx-auto w-full max-w-4xl">
              <MobileStepBar step={step} />

              <div className="mb-7">
                <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-[34px]">
                  {step === 6 ? 'ពាក្យសុំត្រូវបានដាក់ស្នើ' : currentStep.label}
                </h1>
                <p className="mt-2 text-[15px] leading-6 text-slate-600">{currentStep.hint}</p>
              </div>

              {step < 5 && (
                <div className="mb-6 flex overflow-hidden rounded-full border border-slate-200">
                  {STEPS.slice(0, 4).map((s, i) => {
                    const isComplete = step > s.id
                    const isCurrent = step === s.id
                    return (
                      <div
                        key={s.id}
                        className={`flex flex-1 items-center justify-center px-3 py-2 text-xs font-semibold transition-colors ${
                          i > 0 ? 'border-l border-slate-200' : ''
                        } ${
                          isCurrent
                            ? 'bg-brand-950 text-white'
                            : isComplete
                            ? 'bg-brand-100 text-brand-800'
                            : 'bg-white text-slate-400'
                        }`}
                      >
                        {s.label}
                      </div>
                    )
                  })}
                </div>
              )}

              <div className="border border-border bg-surface p-6 sm:p-8">
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

            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

function BrandPanel({ currentStep: _ }: { currentStep: StepId }) {
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
          {[
            { title: 'សន្សំទទួលការប្រាក់ ៣%', description: 'ការប្រាក់ប្រចាំខែលើសមតុល្យសន្សំសរុបរបស់អ្នក។' },
            { title: 'កម្ជីសមាជិកដោយយុត្តិធម៌', description: 'ដាក់ស្នើ តាមដាន និង សងកម្ជីតាមដំណើរការតម្លាភាព។' },
            { title: 'ការជូនដំណឹងភ្លាមៗ', description: 'ទទួលការជូនដំណឹងសន្សំ និង កម្ជីតាមរយៈ Telegram។' },
          ].map((b) => (
            <li key={b.title} className="flex items-start gap-3 rounded-2xl bg-white/5 px-4 py-3 ring-1 ring-white/10">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-300" />
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
              <p className="text-sm font-semibold">ទិន្នន័យរបស់អ្នកត្រូវបានការពារ</p>
            </div>
            <p className="mt-2 text-xs leading-5 text-brand-200/80">
              ឯកសារត្រូវបានរក្សាទុកដោយឯកជន និង ត្រួតពិនិត្យតែដោយអ្នកគ្រប់គ្រងដែលបានទទួលការអនុញ្ញាត។
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

      <Field label="អាសយដ្ឋានអ៊ីមែល" htmlFor="email" optional>
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
      </div>

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

      <Field label="កន្លែងធ្វើការ" htmlFor="workplace" optional>
        <div className="relative">
          <Building2 className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-slate-400" />
          <select
            id="workplace"
            value={formData.workplace}
            onChange={(e) => updateField('workplace', e.target.value)}
            className={`${inputBase} app-input--with-icon appearance-none`}
          >
            <option value="">-- ជ្រើសរើស --</option>
            {WORKPLACE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </Field>

      <EmergencyContacts
        contacts={formData.emergency_contacts}
        onChange={(contacts) => updateField('emergency_contacts', contacts)}
      />

      <div className="space-y-1.5">
        <p className="text-sm font-semibold text-slate-800">អាសយដ្ឋាន <span className="text-xs font-normal text-slate-400">(ស្រេចចិត្ត)</span></p>
        <CambodiaAddressSelect
          value={parseCambodiaAddress(formData.address)}
          onChange={(addr) => updateField('address', formatCambodiaAddress(addr))}
          selectClassName={inputBase}
          inputClassName={inputBase}
        />
      </div>
    </div>
  )
}

function EmergencyContacts({
  contacts,
  onChange,
}: {
  contacts: EmergencyContact[]
  onChange: (contacts: EmergencyContact[]) => void
}) {
  const update = (index: number, field: keyof EmergencyContact, value: string) => {
    const next = contacts.map((c, i) => (i === index ? { ...c, [field]: value } : c))
    onChange(next)
  }

  const add = () => onChange([...contacts, { full_name: '', phone: '' }])

  const remove = (index: number) => onChange(contacts.filter((_, i) => i !== index))

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-800">ទំនាក់ទំនងបន្ទាន់</p>
        <button
          type="button"
          onClick={add}
          className="inline-flex items-center gap-1.5 rounded-lg border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-800 transition hover:bg-brand-100"
        >
          <Plus className="h-3.5 w-3.5" />
          បន្ថែម
        </button>
      </div>

      {contacts.length === 0 && (
        <button
          type="button"
          onClick={add}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 py-5 text-sm font-medium text-slate-400 transition hover:border-brand-300 hover:text-brand-700"
        >
          <Plus className="h-4 w-4" />
          បន្ថែមទំនាក់ទំនងបន្ទាន់
        </button>
      )}

      <div className="space-y-3">
        {contacts.map((contact, i) => (
          <div key={i} className="relative rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">ទំនាក់ទំនងលេខ {i + 1}</span>
              <button
                type="button"
                onClick={() => remove(i)}
                className="grid h-7 w-7 place-items-center rounded-lg text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">ឈ្មោះពេញ</label>
                <IconInput
                  icon={<User className="h-4.5 w-4.5" />}
                  type="text"
                  value={contact.full_name}
                  onChange={(e) => update(i, 'full_name', e.target.value)}
                  placeholder="ឈ្មោះអ្នកទំនាក់ទំនង"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">លេខទូរស័ព្ទ</label>
                <IconInput
                  icon={<Phone className="h-4.5 w-4.5" />}
                  type="tel"
                  value={contact.phone}
                  onChange={(e) => update(i, 'phone', e.target.value)}
                  placeholder="0812345678"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function StepReferee({ formData, updateField }: StepProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<MemberSearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)

  const isSelected = Boolean(formData.referee_id)

  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      setShowResults(false)
      return
    }
    const timer = setTimeout(async () => {
      setIsSearching(true)
      try {
        const members = await searchActiveMembers(query)
        setResults(members)
        setShowResults(true)
      } finally {
        setIsSearching(false)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [query])

  function selectMember(member: MemberSearchResult) {
    updateField('referee_id', member.id)
    updateField('referee_display_name', member.full_name_kh ?? member.full_name_en ?? '')
    setQuery('')
    setResults([])
    setShowResults(false)
  }

  function clearSelection() {
    updateField('referee_id', '')
    updateField('referee_display_name', '')
  }

  return (
    <div className="space-y-5">
      <div className="overflow-hidden rounded-2xl border border-brand-100 bg-brand-50/60">
        <div className="flex items-start gap-3 p-5">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-brand-700 ring-1 ring-brand-100">
            <UserCheck className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-semibold text-brand-950">ហេតុអ្វីបានជាយើងសុំមេគ្រុម</p>
            <p className="mt-1 text-[13px] leading-6 text-brand-900/80">
              មេគ្រុមគឺជាសមាជិកសន្សំដែលមានស្រាប់ដែលផ្ទៀងផ្ទាត់ជូនពាក្យសុំរបស់អ្នក។
              អ្នកអាចរំលងជំហាននេះ និង បន្ថែមក្រោយ។
            </p>
          </div>
        </div>
      </div>

      {isSelected ? (
        <div className="flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50/70 px-4 py-3.5">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-emerald-700 ring-1 ring-emerald-200">
              <UserCheck className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-900">{formData.referee_display_name}</p>
              <p className="text-xs text-emerald-700">មេគ្រុមបានជ្រើសរើស</p>
            </div>
          </div>
          <button
            type="button"
            onClick={clearSelection}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-slate-400 transition hover:bg-white hover:text-rose-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ស្វែងរកតាមឈ្មោះ ទូរស័ព្ទ ឬអ៊ីមែល..."
              className={`${inputBase} app-input--with-icon pr-10`}
            />
            {isSearching && (
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2">
                <LoadingSpinner size="sm" color="brand" />
              </span>
            )}
          </div>

          {showResults && (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-md">
              {results.length === 0 ? (
                <p className="px-4 py-3 text-sm text-slate-500">រកមិនឃើញសមាជិក</p>
              ) : (
                <ul>
                  {results.map((member, i) => (
                    <li key={member.id}>
                      <button
                        type="button"
                        onClick={() => selectMember(member)}
                        className={`flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-brand-50 ${i > 0 ? 'border-t border-slate-100' : ''}`}
                      >
                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-500">
                          <User className="h-4 w-4" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-slate-900">
                            {memberKhmerName(member)}
                          </p>
                          {(member.phone || member.email) && (
                            <p className="truncate text-xs text-slate-500">
                              {[member.phone, member.email].filter(Boolean).join(' · ')}
                            </p>
                          )}
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}

      <p className="text-xs leading-5 text-slate-500">
        ស្វែងរកមេគ្រុមតាមឈ្មោះ ទូរស័ព្ទ ឬអ៊ីមែល។ ប្រសិនបើ
        អ្នកមិនមានមេគ្រុម សូមទាក់ទងអ្នកគ្រប់គ្រងសន្សំបន្ទាប់ពីការចុះឈ្មោះ។
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
          label="សៀវភៅគ្រួសារ/លេខសៀវភៅស្នាក់នៅ"
          subtitle="សៀវភៅស្នាក់នៅ"
          file={formData.resident_book}
          onChange={(file) => updateField('resident_book', file)}
          accept="image/*,.pdf"
          optional
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
  optional?: boolean
}

function FileUpload({ label, subtitle, file, onChange, accept, optional }: FileUploadProps) {
  return (
    <div className="space-y-2">
      <div>
        <p className="text-sm font-semibold text-slate-800">
          {label}
          {optional && <span className="ml-1.5 text-xs font-normal text-slate-400">(ស្រេចចិត្ត)</span>}
        </p>
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
  return (
    <div className="space-y-5">
      <TelegramConnectSteps />
      <TelegramConnectPanel
        connectToken={connectToken}
        required
        onContinue={onDone}
        description="តំណនេះភ្ជាប់ពាក្យសុំចុះឈ្មោះរបស់អ្នកទៅ Telegram។ បើក Telegram ហើយចុច Start។"
      />
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
            'មេគ្រុមទទួលបានសំណើផ្ទៀងផ្ទាត់ (ប្រសិនបើបានផ្តល់)',
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
          ត្រឡប់ក្រោយទៅទំព័រដើម
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
