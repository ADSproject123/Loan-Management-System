'use client'

import React, { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Steps } from '@/components/ui/Steps'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { KhqrPaymentCard } from '@/components/loans/KhqrPaymentCard'
import { TelegramVerification } from '@/components/ui/TelegramVerification'
import { repayLoan } from '@/app/actions/member'
import { createRepayKhqr, checkRepayKhqr } from '@/app/actions/bakong'
import { showError } from '@/lib/toast'
import { currencySymbol, type CurrencyCode } from '@/lib/currency'
import { formatKhmerDate } from '@/lib/dates'
import { CreditCard, QrCode, Upload, CheckCircle, Info, Loader2, RefreshCw, ShieldCheck } from 'lucide-react'

const STEPS = [
  { id: 1, label: 'បញ្ជាក់ចំនួន', description: 'កំណត់ចំនួន' },
  { id: 2, label: 'ផ្ទៀងផ្ទាត់', description: 'កូដ Telegram' },
  { id: 3, label: 'QR Code', description: 'ស្កេន បង់ និង ភស្តុតាង' },
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

export function LoanRepayForm({
  activeLoan,
  scheduleMonth,
  defaultAmount,
}: {
  activeLoan: ActiveLoan
  scheduleMonth?: number
  defaultAmount?: number
}) {
  const initialAmount = defaultAmount ?? activeLoan.monthly_payment
  const [step, setStep] = useState(1)
  const [payAmount, setPayAmount] = useState(initialAmount.toString())
  const currency: CurrencyCode = 'USD'
  const [evidence, setEvidence] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [khqr, setKhqr] = useState<{
    qrImage: string
    md5: string
    expiresAt: number
    merchantName: string
    currency: 'USD' | 'KHR'
  } | null>(null)
  const [khqrLoading, setKhqrLoading] = useState(false)
  const [khqrError, setKhqrError] = useState<string | null>(null)
  const [khqrExpired, setKhqrExpired] = useState(false)
  const [bakongVerified, setBakongVerified] = useState(false)

  const generateKhqr = useCallback(async (amt: number) => {
    setKhqr(null)
    setKhqrError(null)
    setKhqrExpired(false)
    setKhqrLoading(true)
    const result = await createRepayKhqr(amt)
    setKhqrLoading(false)
    if (!result.success) {
      setKhqrError(result.error)
      return
    }
    setKhqr({
      qrImage: result.qrImage,
      md5: result.md5,
      expiresAt: result.expiresAt,
      merchantName: result.merchantName,
      currency: result.currency,
    })
  }, [])

  // Poll Bakong while the QR is on screen; once the transfer settles the
  // repayment is recorded server-side and we jump straight to the done step.
  useEffect(() => {
    if (step !== 3 || !khqr || khqrExpired) return
    let active = true
    const interval = setInterval(async () => {
      const result = await checkRepayKhqr(khqr.md5)
      if (!active || !result.success || !result.paid) return
      clearInterval(interval)
      setBakongVerified(true)
      setStep(4)
    }, 4000)
    return () => {
      active = false
      clearInterval(interval)
    }
  }, [step, khqr, khqrExpired])

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
          <p className="text-brand-200 text-xs uppercase tracking-wider font-semibold mb-2">
            {scheduleMonth ? `បង់ប្រាក់ខែ ${scheduleMonth}` : 'កម្ជីសកម្ម'}
          </p>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-2xl font-bold">{currencySymbol(currency)}{activeLoan.remaining.toLocaleString()}</p>
              <p className="text-brand-200 text-sm mt-1">សមតុល្យនៅសល់</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-semibold">{currencySymbol(currency)}{initialAmount.toLocaleString()}</p>
              <p className="text-brand-200 text-sm mt-1">
                {scheduleMonth ? 'ចំនួនត្រូវបង់ខែនេះ' : 'បង់ប្រចាំខែ'}
              </p>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-white/20">
            <p className="text-brand-200 text-xs">
              {activeLoan.purpose}
              {activeLoan.due_date && (
                <> &bull; ផុតកំណត់ {formatKhmerDate(activeLoan.due_date)}</>
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
            <label className="block text-sm font-medium text-gray-700 mb-1.5">ចំនួនទឹកប្រាក់បង់ (USD)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">{currencySymbol()}</span>
              <input
                type="number"
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                onWheel={(e) => e.currentTarget.blur()}
                placeholder="0.00"
                min="100"
                max={activeLoan.remaining}
                className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 text-lg font-semibold text-gray-900"
              />
            </div>
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

      {/* Step 2: Telegram verification */}
      {step === 2 && (
        <Card>
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2.5 bg-brand-100 rounded-lg">
              <ShieldCheck className="w-6 h-6 text-brand-700" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">ផ្ទៀងផ្ទាត់អត្តសញ្ញាណ</h2>
              <p className="text-gray-500 text-sm">បញ្ជាក់ថាជាអ្នកពិតប្រាកដមុនពេលបង់ប្រាក់</p>
            </div>
          </div>

          <TelegramVerification
            action="loan_repay"
            onVerified={() => {
              setStep(3)
              void generateKhqr(amount)
            }}
          />

          <div className="mt-5">
            <Button variant="outline" onClick={() => setStep(1)} className="w-full">
              ត្រឡប់ក្រោយ
            </Button>
          </div>
        </Card>
      )}

      {/* Step 3: QR Code + evidence */}
      {step === 3 && (
        <Card>
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2.5 bg-brand-100 rounded-lg">
              <QrCode className="w-6 h-6 text-brand-700" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">ស្កេន KHQR ដើម្បីបង់ប្រាក់</h2>
              <p className="text-gray-500 text-sm">ស្កេនជាមួយកម្មវិធីធនាគារដែលគាំទ្រ KHQR</p>
            </div>
          </div>

          <div className="mb-6">
            {khqrLoading && (
              <div className="flex flex-col items-center justify-center gap-3 py-16">
                <Loader2 className="w-8 h-8 text-brand-700 animate-spin" />
                <p className="text-sm text-gray-500">កំពុងបង្កើត KHQR...</p>
              </div>
            )}

            {!khqrLoading && khqrError && (
              <div className="text-center py-10">
                <p className="text-sm text-red-600 mb-4">{khqrError}</p>
                <Button variant="outline" onClick={() => generateKhqr(amount)}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  ព្យាយាមម្តងទៀត
                </Button>
              </div>
            )}

            {!khqrLoading && khqr && (
              <>
                <KhqrPaymentCard
                  key={khqr.md5}
                  merchantName={khqr.merchantName}
                  amount={amount}
                  currency={khqr.currency}
                  qrImage={khqr.qrImage}
                  expiresAt={khqr.expiresAt}
                  expired={khqrExpired}
                  onExpired={() => setKhqrExpired(true)}
                />
                <div className="mt-4 text-center">
                  {khqrExpired ? (
                    <Button variant="outline" onClick={() => generateKhqr(amount)}>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      បង្កើត QR ថ្មី
                    </Button>
                  ) : (
                    <p className="inline-flex items-center gap-2 text-sm text-gray-500">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      កំពុងរង់ចាំការបង់ប្រាក់ — នឹងបញ្ជាក់ដោយស្វ័យប្រវត្តិបន្ទាប់ពីបង់រួច
                    </p>
                  )}
                </div>
              </>
            )}
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-yellow-700 space-y-1">
                <p>ផ្ទេរចំនួនពិតប្រាកដ <strong>{currencySymbol(currency)}{amount.toLocaleString()}</strong> — ចំនួនត្រូវបានចាក់សោក្នុង QR រួចហើយ។</p>
                <p>បន្ទាប់ពីបង់រួច ប្រព័ន្ធនឹងបញ្ជាក់ដោយស្វ័យប្រវត្តិ។ បើមិនបញ្ជាក់ សូមផ្ទុកភស្តុតាងខាងក្រោម ហើយចុច «ដាក់ស្នើការសង»។</p>
              </div>
            </div>
          </div>

          {/* Evidence upload (fallback when Bakong doesn't auto-confirm) */}
          <div className="mb-5">
            <p className="text-sm font-medium text-gray-700 mb-2">ផ្ទុកភស្តុតាងបង់ប្រាក់</p>
            <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-brand-500 hover:bg-brand-50 transition-colors">
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
          </div>

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
            <Button variant="outline" onClick={() => setStep(1)} disabled={loading} className="flex-1">ត្រឡប់ក្រោយ</Button>
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
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {bakongVerified ? 'ការបង់ប្រាក់ជោគជ័យ!' : 'ការសងត្រូវបានដាក់ស្នើ!'}
            </h2>
            <p className="text-gray-600 mb-2">
              {bakongVerified ? (
                <>ការបង់ប្រាក់ចំនួន <strong>{currencySymbol(currency)}{amount.toLocaleString()}</strong> ត្រូវបានបញ្ជាក់ដោយ Bakong (KHQR)។</>
              ) : (
                <>ការសងរបស់អ្នកចំនួន <strong>{currencySymbol(currency)}{amount.toLocaleString()}</strong> ត្រូវបានទទួល។</>
              )}
            </p>
            <p className="text-gray-500 text-sm mb-6">
              អ្នកគ្រប់គ្រងនឹងទទួលការបង់ប្រាក់របស់អ្នកក្នុងរយៈពេល ២៤ ម៉ោង និង ធ្វើបច្ចុប្បន្នភាពសមតុល្យកម្ជីរបស់អ្នក។
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
                  <span className="font-medium text-green-900">
                    {bakongVerified ? 'បានបញ្ជាក់ដោយ Bakong — រង់ចាំការទទួល' : 'កំពុងរង់ចាំការទទួល'}
                  </span>
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
                href="/dashboard/loans/repay"
                className="inline-flex items-center gap-2 bg-brand-950 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-brand-800 transition-colors"
              >
                ត្រឡប់ទៅតារាបង់ប្រចាំខែ
              </Link>
              <Link
                href="/dashboard/loans"
                className="inline-flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors"
              >
                មើលកម្ជីរបស់ខ្ញុំ
              </Link>
            </div>
          </div>
        </Card>
      )}
    </>
  )
}
