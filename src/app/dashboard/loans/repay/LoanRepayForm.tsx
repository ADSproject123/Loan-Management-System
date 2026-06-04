'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Steps } from '@/components/ui/Steps'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { repayLoan } from '@/app/actions/member'
import { showError } from '@/lib/toast'
import { currencySymbol, type CurrencyCode } from '@/lib/currency'
import { CurrencySelect } from '@/components/ui/CurrencySelect'
import { CreditCard, QrCode, Upload, CheckCircle, Info } from 'lucide-react'

const STEPS = [
  { id: 1, label: 'បញ្ជាក់ចំនួន', description: 'កំណត់ចំនួន' },
  { id: 2, label: 'QR Code', description: 'ស្កេន និង បង់' },
  { id: 3, label: 'ភស្តុតាង', description: 'ផ្ទុកភស្តុតាង' },
  { id: 4, label: 'រួចរាល់', description: 'បានដាក់ស្នើ' },
]

export type ActiveLoan = {
  id: string
  amount: number
  remaining: number
  monthly_payment: number
  currency: CurrencyCode
  purpose: string
  due_date: string | null
}

export function LoanRepayForm({ activeLoan }: { activeLoan: ActiveLoan }) {
  const [step, setStep] = useState(1)
  const [payAmount, setPayAmount] = useState(activeLoan.monthly_payment.toString())
  const [currency, setCurrency] = useState<CurrencyCode>(activeLoan.currency)
  const [evidence, setEvidence] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const handleConfirmAmount = () => {
    const amt = parseFloat(payAmount)
    if (!payAmount || isNaN(amt) || amt <= 0) {
      showError('សូមបញ្ចូលចំនួនទឹកប្រាក់បង់ត្រឹមត្រូវ។')
      return
    }
    if (amt > activeLoan.remaining) {
      showError(`ចំនួនទឹកប្រាក់មិនអាចលើសសមតុល្យកម្ជីនៅសល់ ${currencySymbol(currency)}${activeLoan.remaining.toLocaleString()} ។`)
      return
    }
    setStep(2)
  }

  const handleSubmit = async () => {
    if (!evidence) {
      showError('សូមផ្ទុកភស្តុតាងបង់ប្រាក់។')
      return
    }
    setLoading(true)

    const payload = new FormData()
    payload.append('amount', payAmount)
    payload.append('currency', currency)
    payload.append('evidence', evidence)

    const result = await repayLoan(payload)
    setLoading(false)

    if (!result.success) {
      showError(result.error ?? 'មិនអាចដាក់ស្នើការសងបានទេ។')
      return
    }

    setStep(4)
  }

  const amount = parseFloat(payAmount) || 0
  const newRemaining = activeLoan.remaining - amount

  return (
    <>
      {step < 4 && (
        <div className="mb-8">
          <Steps steps={STEPS} currentStep={step} />
        </div>
      )}

      {/* Active Loan Summary */}
      {step < 4 && (
        <div className="bg-brand-950 text-white rounded-xl p-5 mb-6">
          <p className="text-brand-200 text-xs uppercase tracking-wider font-semibold mb-2">កម្ជីសកម្ម</p>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-2xl font-bold">{currencySymbol(currency)}{activeLoan.remaining.toLocaleString()}</p>
              <p className="text-brand-200 text-sm mt-1">សមតុល្យនៅសល់</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-semibold">{currencySymbol(currency)}{activeLoan.monthly_payment.toLocaleString()}</p>
              <p className="text-brand-200 text-sm mt-1">បង់ប្រចាំខែ</p>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-white/20">
            <p className="text-brand-200 text-xs">
              {activeLoan.purpose}
              {activeLoan.due_date && (
                <> &bull; ផុតកំណត់ {new Date(activeLoan.due_date).toLocaleDateString('km-KH', { month: 'long', day: 'numeric', year: 'numeric' })}</>
              )}
            </p>
          </div>
        </div>
      )}

      {/* Step 1: Confirm Amount */}
      {step === 1 && (
        <Card>
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2.5 bg-brand-100 rounded-lg">
              <CreditCard className="w-6 h-6 text-brand-700" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">បញ្ជាក់ចំនួនទឹកប្រាក់សង</h2>
              <p className="text-gray-500 text-sm">តើអ្នកចង់បង់ប៉ុន្មាន?</p>
            </div>
          </div>

          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">ចំនួនទឹកប្រាក់បង់ ({currency})</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">{currencySymbol(currency)}</span>
                <input
                  type="number"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  onWheel={(e) => e.currentTarget.blur()}
                  placeholder="0.00"
                  min="100"
                  max={activeLoan.remaining}
                  className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 text-lg font-semibold text-gray-900"
                />
              </div>
              <CurrencySelect value={currency} onChange={setCurrency} className="shrink-0" />
            </div>
          </div>

          <div className="flex gap-2 mb-5">
            {[activeLoan.monthly_payment, activeLoan.monthly_payment * 2, activeLoan.remaining].map((amt, i) => (
              <button
                key={i}
                onClick={() => setPayAmount(amt.toString())}
                className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors border ${
                  parseFloat(payAmount) === amt
                    ? 'bg-brand-950 text-white border-brand-900'
                    : 'bg-white border-gray-300 text-gray-700 hover:border-brand-500 hover:text-brand-700 hover:bg-brand-50'
                }`}
              >
                {i === 0 ? 'ប្រចាំខែ' : i === 1 ? 'ទ្វេដង' : 'ទាំងអស់'}
                <br />
                {currencySymbol(currency)}{amt.toLocaleString()}
              </button>
            ))}
          </div>

          {amount > 0 && (
            <div className="bg-brand-50 rounded-lg p-4 mb-5">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-brand-700">ចំនួនទឹកប្រាក់បង់</span>
                  <span className="font-semibold text-brand-900">{currencySymbol(currency)}{amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-brand-700">នៅសល់បច្ចុប្បន្ន</span>
                  <span className="font-semibold text-brand-900">{currencySymbol(currency)}{activeLoan.remaining.toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-t border-brand-200 pt-2">
                  <span className="text-brand-700 font-medium">នៅសល់ថ្មី</span>
                  <span className={`font-bold ${newRemaining <= 0 ? 'text-green-700' : 'text-brand-900'}`}>
                    {newRemaining <= 0 ? 'បានបង់ពេញ!' : `${currencySymbol(currency)}${newRemaining.toLocaleString()}`}
                  </span>
                </div>
              </div>
            </div>
          )}

          <Button onClick={handleConfirmAmount} className="w-full" size="lg">
            បន្តទៅការបង់ប្រាក់
          </Button>
        </Card>
      )}

      {/* Step 2: QR Code */}
      {step === 2 && (
        <Card>
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2.5 bg-brand-100 rounded-lg">
              <QrCode className="w-6 h-6 text-brand-700" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">ស្កេន QR Code ដើម្បីបង់ប្រាក់</h2>
              <p className="text-gray-500 text-sm">ផ្ទេរចំនួនពិតប្រាកដ {currencySymbol(currency)}{amount.toLocaleString()}</p>
            </div>
          </div>

          <div className="text-center mb-6">
            <div className="bg-gray-100 rounded-xl p-8 inline-block mb-4">
              <div className="w-48 h-48 bg-white rounded-lg flex items-center justify-center border-2 border-gray-300">
                <QrCode className="w-32 h-32 text-gray-400" />
              </div>
            </div>
            <p className="font-bold text-2xl text-gray-900">{currencySymbol(currency)}{amount.toLocaleString()}</p>
            <p className="text-gray-500 text-sm mt-1">ការសងកម្ជី</p>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-yellow-700 space-y-1">
                <p>ផ្ទេរចំនួនពិតប្រាកដ <strong>{currencySymbol(currency)}{amount.toLocaleString()}</strong> — ចំនួនមួយផ្នែកនឹងបណ្តាលឱ្យពន្យារពេលផ្ទៀងផ្ទាត់។</p>
                <p>ថតរូបអេក្រង់នៃការបញ្ជាក់មុនបិទទំព័រនេះ។</p>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep(1)} className="flex-1">ត្រឡប់ក្រោយ</Button>
            <Button onClick={() => setStep(3)} className="flex-1">
              ខ្ញុំបានបង់ហើយ
            </Button>
          </div>
        </Card>
      )}

      {/* Step 3: Evidence */}
      {step === 3 && (
        <Card>
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2.5 bg-orange-100 rounded-lg">
              <Upload className="w-6 h-6 text-orange-700" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">ផ្ទុកភស្តុតាងបង់ប្រាក់</h2>
              <p className="text-gray-500 text-sm">ដាក់ស្នើរូបអេក្រង់នៃការផ្ទេររបស់អ្នក</p>
            </div>
          </div>

          <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-brand-500 hover:bg-brand-50 transition-colors mb-5">
            <Upload className="w-10 h-10 text-gray-400 mb-3" />
            {evidence ? (
              <div className="text-center">
                <p className="text-sm font-medium text-brand-700">{evidence.name}</p>
                <p className="text-xs text-gray-400 mt-1">ចុចដើម្បីប្តូរ</p>
              </div>
            ) : (
              <>
                <p className="text-sm font-medium text-gray-600">ចុចដើម្បីផ្ទុកភស្តុតាង</p>
                <p className="text-xs text-gray-400 mt-1">JPG, PNG ឬ PDF អតិបរមា ១០ មេកាបៃ</p>
              </>
            )}
            <input
              type="file"
              accept="image/*,.pdf"
              className="hidden"
              onChange={(e) => setEvidence(e.target.files?.[0] ?? null)}
            />
          </label>

          <div className="bg-gray-50 rounded-lg p-4 mb-5 text-sm">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-500">ចំនួនទឹកប្រាក់បង់</span>
              <span className="font-semibold text-gray-900">{currencySymbol(currency)}{amount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">សមតុល្យនៅសល់ថ្មី</span>
              <span className="font-semibold text-gray-900">{newRemaining <= 0 ? 'បានបង់ពេញ' : `${currencySymbol(currency)}${newRemaining.toLocaleString()}`}</span>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep(2)} disabled={loading} className="flex-1">ត្រឡប់ក្រោយ</Button>
            <Button onClick={handleSubmit} loading={loading} className="flex-1">
              ដាក់ស្នើការសង
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
            <h2 className="text-2xl font-bold text-gray-900 mb-2">ការសងត្រូវបានដាក់ស្នើ!</h2>
            <p className="text-gray-600 mb-2">
              ការសងរបស់អ្នកចំនួន <strong>{currencySymbol(currency)}{amount.toLocaleString()}</strong> ត្រូវបានទទួល។
            </p>
            <p className="text-gray-500 text-sm mb-6">
              អ្នកគ្រប់គ្រងនឹងផ្ទៀងផ្ទាត់ការបង់ប្រាក់របស់អ្នកក្នុងរយៈពេល ២៤ ម៉ោង និង ធ្វើបច្ចុប្បន្នភាពសមតុល្យកម្ជីរបស់អ្នក។
            </p>

            <div className="bg-green-50 rounded-xl p-4 mb-6 text-left">
              <p className="text-green-900 font-semibold text-sm mb-2">សង្ខេបការសង</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-green-700">ចំនួនបានបង់</span>
                  <span className="font-medium text-green-900">{currencySymbol(currency)}{amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-700">ស្ថានភាព</span>
                  <span className="font-medium text-green-900">កំពុងរង់ចាំការផ្ទៀងផ្ទាត់</span>
                </div>
                {newRemaining > 0 && (
                  <div className="flex justify-between">
                    <span className="text-green-700">នៅសល់ថ្មី</span>
                    <span className="font-medium text-green-900">{currencySymbol(currency)}{newRemaining.toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>

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
  )
}
