'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Steps } from '@/components/ui/Steps'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { requestLoan } from '@/app/actions/member'
import { showError } from '@/lib/toast'
import { currencySymbol, type CurrencyCode } from '@/lib/currency'
import { buildLoanPaymentSchedule, loanRepaymentSummary } from '@/lib/interestCalculations'
import { LoanPaymentSchedule } from '@/components/loans/LoanPaymentSchedule'
import {
  LOAN_TO_SAVINGS_MULTIPLIER,
  type LoanEligibility,
  validateLoanRequestAmount,
} from '@/lib/loanEligibility'
import {
  AlertTriangle,
  ArrowLeft,
  CreditCard,
  Users,
  CheckCircle,
  Mail,
  Phone,
  User,
  PiggyBank,
} from 'lucide-react'

const STEPS = [
  { id: 1, label: 'ព័ត៌មានកម្ជី', description: 'ចំនួន និង គោលបំណង' },
  { id: 2, label: 'អ្នកធានា', description: 'ការផ្ទៀងផ្ទាត់' },
  { id: 3, label: 'ត្រួតពិនិត្យ', description: 'បញ្ជាក់ និង ដាក់ស្នើ' },
  { id: 4, label: 'រួចរាល់', description: 'បានដាក់ស្នើ' },
]

interface LoanFormData {
  amount: string
  purpose: string
  start_date: string
  end_date: string
  referee_name: string
  referee_phone: string
  referee_email: string
}

/** YYYY-MM-DD for a date offset from today by the given number of months. */
function dateFromToday(monthsAhead: number) {
  const d = new Date()
  d.setMonth(d.getMonth() + monthsAhead)
  return d.toISOString().slice(0, 10)
}

/** Whole months between two YYYY-MM-DD dates, floored, minimum 1. */
function monthsBetween(start: string, end: string) {
  if (!start || !end) return 0
  const s = new Date(start)
  const e = new Date(end)
  let months = (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth())
  if (e.getDate() < s.getDate()) months -= 1
  return Math.max(1, months)
}

export function LoanRequestForm({
  monthlyLoanInterestRate,
  eligibility,
  currency,
}: {
  monthlyLoanInterestRate: number
  eligibility: LoanEligibility
  currency: CurrencyCode
}) {
  const sym = currencySymbol(currency)
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<LoanFormData>({
    amount: '',
    purpose: '',
    start_date: dateFromToday(0),
    end_date: dateFromToday(12),
    referee_name: '',
    referee_phone: '',
    referee_email: '',
  })

  const update = (field: keyof LoanFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const validate = () => {
    if (step === 1) {
      const amt = parseFloat(formData.amount)
      if (!formData.amount || isNaN(amt) || amt <= 0) {
        showError('សូមបញ្ចូលចំនួនទឹកប្រាក់កម្ជីត្រឹមត្រូវ។')
        return false
      }
      if (!formData.purpose.trim()) {
        showError('សូមពិពណ៌នាគោលបំណងនៃកម្ជីរបស់អ្នក។')
        return false
      }
      if (!formData.start_date || !formData.end_date) {
        showError('សូមជ្រើសរើសកាលបរិច្ឆេទចាប់ផ្តើម និង បញ្ចប់នៃកម្ជី។')
        return false
      }
      if (formData.end_date <= formData.start_date) {
        showError('កាលបរិច្ឆេទបញ្ចប់ត្រូវនៅក្រោយកាលបរិច្ឆេទចាប់ផ្តើម។')
        return false
      }
      const amountCheck = validateLoanRequestAmount(amt, eligibility)
      if (!amountCheck.valid) {
        showError(amountCheck.error)
        return false
      }
    }
    if (step === 2) {
      if (!formData.referee_name.trim()) {
        showError('សូមបញ្ចូលឈ្មោះពេញរបស់អ្នកធានា។')
        return false
      }
      if (!formData.referee_phone.trim()) {
        showError('សូមបញ្ចូលលេខទូរស័ព្ទរបស់អ្នកធានា។')
        return false
      }
    }
    return true
  }

  const handleNext = () => {
    if (!validate()) return
    setStep((prev) => Math.min(prev + 1, 4))
  }

  const handleSubmit = async () => {
    setLoading(true)

    const payload = new FormData()
    payload.append('amount', formData.amount)
    payload.append('currency', currency)
    payload.append('purpose', formData.purpose)
    payload.append('start_date', formData.start_date)
    payload.append('end_date', formData.end_date)
    payload.append('referee_name', formData.referee_name)
    payload.append('referee_phone', formData.referee_phone)
    payload.append('referee_email', formData.referee_email)

    const result = await requestLoan(payload)
    setLoading(false)

    if (!result.success) {
      showError(result.error ?? 'មិនអាចដាក់ស្នើពាក្យសុំកម្ជីបានទេ។')
      return
    }

    setStep(4)
  }

  const loanAmount = parseFloat(formData.amount) || 0
  const termMonths = monthsBetween(formData.start_date, formData.end_date) || 12
  const { monthlyPayment, totalRepayment } = loanRepaymentSummary(
    loanAmount,
    termMonths,
    monthlyLoanInterestRate
  )
  const previewSchedule =
    loanAmount > 0 && termMonths > 0
      ? buildLoanPaymentSchedule(
          loanAmount,
          termMonths,
          monthlyLoanInterestRate,
          formData.start_date
        ).map((entry) => ({ ...entry, paidAmount: 0, pendingAmount: 0, status: 'pending' as const }))
      : []

  return (
    <div className="p-6 md:p-8 w-full">
      <div className="mb-6">
        <Link
          href="/dashboard/loans"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          ត្រឡប់ទៅកម្ជី
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">ស្នើសុំកម្ជី</h1>
        <p className="text-gray-500 text-sm mt-1">បំពេញបែបបទដើម្បីដាក់ស្នើពាក្យសុំកម្ជីរបស់អ្នក</p>
      </div>

      {!eligibility.canRequestLoan ? (
        <Card>
          <div className="py-8 text-center">
            <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-amber-100">
              <AlertTriangle className="h-7 w-7 text-amber-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              {eligibility.totalSavings <= 0
                ? 'មិនទាន់អាចស្នើសុំកម្ជីបានទេ'
                : 'ឈានដល់ដែនកំណត់កម្ជីអតិបរមារួចហើយ'}
            </h2>
            <p className="text-gray-600 text-sm max-w-md mx-auto mb-6">
              {eligibility.totalSavings <= 0 ? (
                <>
                  អ្នកត្រូវមានការសន្សំដែលបានផ្ទៀងផ្ទាត់មុនពេលអាចស្នើសុំកម្ជីបាន។
                  សូមដាក់ស្នើការសន្សំរបស់អ្នកជាមុនសិន។
                </>
              ) : (
                <>
                  អ្នកអាចស្នើសុំកម្ជីបានរហូតដល់ {LOAN_TO_SAVINGS_MULTIPLIER} ដងនៃសមតុល្យសន្សំរបស់អ្នក
                  ({sym}{eligibility.maxTotalLoanPrincipal.toLocaleString()})។
                  សមតុល្យកម្ជីបច្ចុប្បន្នរបស់អ្នកគឺ {sym}{eligibility.committedLoanPrincipal.toLocaleString()}។
                </>
              )}
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {eligibility.totalSavings <= 0 ? (
                <Link
                  href="/dashboard/savings/add"
                  className="inline-flex items-center gap-2 bg-brand-950 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-brand-800 transition-colors"
                >
                  <PiggyBank className="w-4 h-4" />
                  ស្នើសុំការសន្សំ
                </Link>
              ) : null}
              <Link
                href="/dashboard/loans"
                className="inline-flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors"
              >
                ត្រឡប់ទៅកម្ជី
              </Link>
            </div>
          </div>
        </Card>
      ) : (
        <>
      {step < 4 && (
        <div className="mb-8">
          <Steps steps={STEPS} currentStep={step} />
        </div>
      )}

      {step < 4 && (
        <div className="bg-brand-950 text-white rounded-xl p-5 mb-6">
          <p className="text-brand-200 text-xs uppercase tracking-wider font-semibold mb-2">សមតុល្យសន្សំផ្ទៀងផ្ទាត់</p>
          <p className="text-2xl font-bold">{sym}{eligibility.totalSavings.toLocaleString()}</p>
          <p className="text-brand-200 text-sm mt-1">
            អតិបរមាកម្ជីអាចស្នើសុំ៖ {sym}{eligibility.availableLoanAmount.toLocaleString()} ({LOAN_TO_SAVINGS_MULTIPLIER} ដងនៃសន្សំ)
          </p>
        </div>
      )}

      {/* Step 1: Loan Details */}
      {step === 1 && (
        <Card>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-brand-100 rounded-lg">
              <CreditCard className="w-6 h-6 text-brand-700" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">ព័ត៌មានកម្ជី</h2>
              <p className="text-gray-500 text-sm">ប្រាប់យើងអំពីការស្នើសុំកម្ជីរបស់អ្នក</p>
            </div>
          </div>

          <div className="space-y-4 mb-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">ចំនួនទឹកប្រាក់កម្ជី ({currency})</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">{sym}</span>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => update('amount', e.target.value)}
                  onWheel={(e) => e.currentTarget.blur()}
                  placeholder="0.00"
                  min="1"
                  max={eligibility.availableLoanAmount}
                  step="1"
                  className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 text-lg font-semibold text-gray-900"
                />
              </div>
              <p className="text-gray-400 text-xs mt-1">
                អតិបរមា {sym}{eligibility.availableLoanAmount.toLocaleString()} ({LOAN_TO_SAVINGS_MULTIPLIER} ដងនៃសមតុល្យសន្សំរបស់អ្នក)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">គោលបំណងកម្ជី</label>
              <textarea
                value={formData.purpose}
                onChange={(e) => update('purpose', e.target.value)}
                placeholder="ពិពណ៌នាមូលហេតុនៃការស្នើសុំកម្ជីរបស់អ្នក..."
                rows={3}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">រយៈពេលកម្ជី</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <span className="block text-xs text-gray-500 mb-1">ចាប់ផ្តើម</span>
                  <input
                    type="date"
                    value={formData.start_date}
                    max={formData.end_date || undefined}
                    onChange={(e) => update('start_date', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 text-base font-medium text-gray-900"
                  />
                </div>
                <div>
                  <span className="block text-xs text-gray-500 mb-1">បញ្ចប់</span>
                  <input
                    type="date"
                    value={formData.end_date}
                    min={formData.start_date || undefined}
                    onChange={(e) => update('end_date', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 text-base font-medium text-gray-900"
                  />
                </div>
              </div>
              {termMonths > 0 && formData.end_date > formData.start_date && (
                <p className="text-gray-400 text-xs mt-1.5">រយៈពេលប្រមាណ {termMonths} ខែ</p>
              )}
            </div>
          </div>

          {loanAmount > 0 && (
            <div className="space-y-5 mb-5">
              <div className="bg-brand-50 rounded-xl p-4">
                <p className="text-brand-900 font-semibold text-sm mb-3">ការប៉ាន់ប្រមាណកម្ជី</p>
                <div className="space-y-2">
                  {[
                    { label: 'ចំនួនទឹកប្រាក់កម្ជី', value: `${sym}${loanAmount.toLocaleString()}` },
                    { label: 'ប្រាក់សងប្រមាណប្រចាំខែ', value: `${sym}${monthlyPayment.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}` },
                    { label: 'ការសងសរុប', value: `${sym}${totalRepayment.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}` },
                  ].map((item) => (
                    <div key={item.label} className="flex justify-between text-sm">
                      <span className="text-brand-700">{item.label}</span>
                      <span className="font-medium text-brand-900">{item.value}</span>
                    </div>
                  ))}
                </div>
                <p className="text-brand-500 text-xs mt-3">
                  * ការប៉ាន់ប្រមាណផ្អែកលើចំនួនកម្ជី រយៈពេល និង អត្រាការប្រាក់ {monthlyLoanInterestRate}% ប្រចាំខែ
                </p>
              </div>

              {previewSchedule.length > 0 && (
                <LoanPaymentSchedule schedule={previewSchedule} currency={currency} compact />
              )}
            </div>
          )}

          <Button onClick={handleNext} className="w-full" size="lg">
            បន្ត
          </Button>
        </Card>
      )}

      {/* Step 2: Referee */}
      {step === 2 && (
        <Card>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-purple-100 rounded-lg">
              <Users className="w-6 h-6 text-purple-700" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">ការផ្ទៀងផ្ទាត់អ្នកធានា</h2>
              <p className="text-gray-500 text-sm">សមាជិកសន្សំត្រូវផ្ទៀងផ្ទាត់ការស្នើសុំកម្ជីរបស់អ្នក</p>
            </div>
          </div>

          <div className="bg-brand-50 border border-brand-200 rounded-lg p-4 mb-5">
            <p className="text-brand-900 text-sm font-medium mb-1">ហេតុអ្វីត្រូវការអ្នកធានា?</p>
            <p className="text-brand-700 text-sm">
              អ្នកធានាគឺជាបុគ្គលដែលអ្នកជឿទុកចិត្ត ដែលអាចបញ្ជាក់ពាក្យសុំកម្ជីរបស់អ្នក។
              សូមបំពេញព័ត៌មានទំនាក់ទំនងរបស់ពួកគេឱ្យបានត្រឹមត្រូវ។
            </p>
          </div>

          <div className="space-y-4 mb-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                ឈ្មោះពេញអ្នកធានា <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={formData.referee_name}
                  onChange={(e) => update('referee_name', e.target.value)}
                  placeholder="ឈ្មោះពេញអ្នកធានា"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                លេខទូរស័ព្ទអ្នកធានា <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="tel"
                  value={formData.referee_phone}
                  onChange={(e) => update('referee_phone', e.target.value)}
                  placeholder="012 345 678"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                អាសយដ្ឋានអ៊ីមែលអ្នកធានា <span className="text-gray-400 font-normal">(ស្រេចចិត្ត)</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={formData.referee_email}
                  onChange={(e) => update('referee_email', e.target.value)}
                  placeholder="referee@example.com"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
                />
              </div>
              <p className="text-gray-400 text-xs mt-2">
                ប្រសិនបើអ្នកផ្តល់អ៊ីមែល និង ជាសមាជិកសន្សំសកម្ម ពួកគេអាចត្រូវបានភ្ជាប់ជាអ្នកធានាក្នុងប្រព័ន្ធ។
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep(1)} className="flex-1">ត្រឡប់ក្រោយ</Button>
            <Button onClick={handleNext} className="flex-1">បន្ត</Button>
          </div>
        </Card>
      )}

      {/* Step 3: Review */}
      {step === 3 && (
        <Card>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-700" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">ត្រួតពិនិត្យ និង ដាក់ស្នើ</h2>
              <p className="text-gray-500 text-sm">សូមត្រួតពិនិត្យពាក្យសុំរបស់អ្នកមុនពេលដាក់ស្នើ</p>
            </div>
          </div>

          <div className="space-y-3 mb-6">
            {[
              { label: 'ចំនួនទឹកប្រាក់កម្ជី', value: `${sym}${loanAmount.toLocaleString()}` },
              { label: 'គោលបំណង', value: formData.purpose },
              { label: 'រយៈពេល', value: `${formData.start_date} → ${formData.end_date} (${termMonths} ខែ)` },
              { label: 'ឈ្មោះអ្នកធានា', value: formData.referee_name },
              { label: 'ទូរស័ព្ទអ្នកធានា', value: formData.referee_phone },
              { label: 'អ៊ីមែលអ្នកធានា', value: formData.referee_email || '—' },
            ].map((item) => (
              <div key={item.label} className="flex items-start justify-between py-2.5 border-b border-gray-100">
                <span className="text-gray-500 text-sm">{item.label}</span>
                <span className="text-gray-900 text-sm font-medium text-right max-w-xs truncate">{item.value}</span>
              </div>
            ))}
          </div>

          <div className="bg-brand-50 rounded-xl p-4 mb-5">
            <p className="text-brand-900 text-sm font-semibold mb-2">តើនឹងមានអ្វីកើតឡើងបន្ទាប់?</p>
            <div className="space-y-2">
              {[
                'អ្នកធានាអាចត្រូវបានទាក់ទងដើម្បីបញ្ជាក់',
                'គណៈកម្មាធិការត្រួតពិនិត្យព័ត៌មានអ្នកធានា',
                'គណៈកម្មាធិការត្រួតពិនិត្យក្នុងរយៈពេល ១-៣ ថ្ងៃ',
                'អ្នកទទួលបានការជូនដំណឹងពីការទទួលយក',
                'កម្ជីត្រូវបានបើកទៅគណនីរបស់អ្នក',
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <span className="w-5 h-5 bg-brand-950 text-white rounded-full flex items-center justify-center text-xs flex-shrink-0 mt-0.5">{i + 1}</span>
                  <span className="text-brand-700">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep(2)} className="flex-1" disabled={loading}>ត្រឡប់ក្រោយ</Button>
            <Button onClick={handleSubmit} loading={loading} className="flex-1">
              ដាក់ស្នើពាក្យសុំ
            </Button>
          </div>
        </Card>
      )}

      {/* Step 4: Success */}
      {step === 4 && (
        <Card>
          <div className="text-center py-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">ពាក្យសុំត្រូវបានដាក់ស្នើ!</h2>
            <p className="text-gray-600 mb-2">
              ពាក្យសុំកម្ជីរបស់អ្នកសម្រាប់ <strong>{sym}{loanAmount.toLocaleString()}</strong> ត្រូវបានដាក់ស្នើ។
            </p>
            <p className="text-gray-500 text-sm mb-6">
              គណៈកម្មាធិការនឹងទាក់ទងអ្នកធានារបស់អ្នកដើម្បីបញ្ជាក់ និង ត្រួតពិនិត្យពាក្យសុំក្នុងរយៈពេល ១-៣ ថ្ងៃ។
            </p>

            <div className="flex gap-3 justify-center">
              <Link
                href="/dashboard/loans"
                className="inline-flex items-center gap-2 bg-brand-950 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-brand-800 transition-colors"
              >
                មើលកម្ជីរបស់ខ្ញុំ
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors"
              >
                ផ្ទាំងគ្រប់គ្រង
              </Link>
            </div>
          </div>
        </Card>
      )}
        </>
      )}
    </div>
  )
}
