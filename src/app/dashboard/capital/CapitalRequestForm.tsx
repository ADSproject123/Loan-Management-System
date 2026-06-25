'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Steps } from '@/components/ui/Steps'
import { requestCapitalWithdrawal } from '@/app/actions/member'

import { showError } from '@/lib/toast'
import { currencySymbol, formatMoney, type CurrencyCode } from '@/lib/currency'
import {
  Wallet,
  CheckCircle,
  AlertTriangle,
  Calendar,
  Info,
  ArrowRight,
  PiggyBank,
  XCircle,

} from 'lucide-react'

const STEPS = [
  { id: 1, label: 'ចំនួនទឹកប្រាក់', description: 'បញ្ចូលចំនួន' },
  { id: 2, label: 'បែបបទ', description: 'បំពេញព័ត៌មាន' },
  { id: 3, label: 'ត្រួតពិនិត្យ', description: 'បញ្ជាក់' },
  { id: 4, label: 'រួចរាល់', description: 'បានដាក់ស្នើ' },
]

// Current date for window check (Jan 20-25)
const today = new Date()
const isWithdrawalWindow = today.getMonth() === 0 && today.getDate() >= 20 && today.getDate() <= 25

export type MemberSavings = {
  totalBalance: number
  monthlyInterest: number
  currency: CurrencyCode
}

export function CapitalRequestForm({ memberSavings }: { memberSavings: MemberSavings }) {
  const sym = currencySymbol(memberSavings.currency)
  const [step, setStep] = useState(1)
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')
  const [afterDecision, setAfterDecision] = useState<'continue' | 'withdraw' | null>(null)
  const [loading, setLoading] = useState(false)
  const handleStep1Next = () => {
    const amt = parseFloat(amount)
    if (!amount || isNaN(amt) || amt <= 0) {
      showError('សូមបញ្ចូលចំនួនទឹកប្រាក់ដកត្រឹមត្រូវ។')
      return
    }
    if (amt > memberSavings.totalBalance) {
      showError(`ចំនួនទឹកប្រាក់មិនអាចលើសសមតុល្យសន្សំរបស់អ្នក ${formatMoney(memberSavings.totalBalance, memberSavings.currency)} ។`)
      return
    }
    setStep(2)
  }

  const handleStep2Next = () => {
    if (!reason.trim()) {
      showError('សូមផ្តល់មូលហេតុនៃការស្នើសុំដើមទុនរបស់អ្នក។')
      return
    }
    if (!afterDecision) {
      showError('សូមជ្រើសរើសអ្វីដែលអ្នកចង់ធ្វើបន្ទាប់ពីការដក។')
      return
    }
    setStep(3)
  }

  const handleSubmit = async () => {
    setLoading(true)

    const payload = new FormData()
    payload.append('amount', amount)
    payload.append('currency', memberSavings.currency)
    payload.append('reason', reason)
    payload.append('after_decision', afterDecision ?? '')

    const result = await requestCapitalWithdrawal(payload)
    setLoading(false)

    if (!result.success) {
      showError(result.error ?? 'មិនអាចដាក់ស្នើពាក្យសុំដើមទុនបានទេ។')
      return
    }

    setStep(4)
  }

  const withdrawAmount = parseFloat(amount) || 0

  return (
    <>

      {isWithdrawalWindow && step < 4 && (
        <div className="bg-green-50 border border-green-300 rounded-xl p-4 mb-6 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
          <div>
            <p className="text-green-900 font-semibold text-sm">អំឡុងពេលដកបានបើក!</p>
            <p className="text-green-700 text-sm">អ្នកអាចដាក់ស្នើពាក្យសុំដកដើមទុនរបស់អ្នកឥឡូវនេះ (២០-២៥ មករា)។</p>
          </div>
        </div>
      )}

      {step < 4 && (
        <div className="mb-8">
          <Steps steps={STEPS} currentStep={step} />
        </div>
      )}

      {/* Current Balance Card */}
      {step < 4 && (
        <div className="bg-brand-950 text-white rounded-xl p-5 mb-6">
          <p className="text-brand-200 text-xs uppercase tracking-wider font-semibold mb-2">សមតុល្យសន្សំរបស់អ្នក</p>
          <p className="text-3xl font-bold">{formatMoney(memberSavings.totalBalance, memberSavings.currency)}</p>
          <p className="text-brand-200 text-sm mt-1">ការប្រាក់ប្រចាំខែ៖ {formatMoney(memberSavings.monthlyInterest, memberSavings.currency)}</p>
        </div>
      )}

      {/* Step 1: Amount */}
      {step === 1 && (
        <Card>
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2.5 bg-purple-100 rounded-lg">
              <Wallet className="w-6 h-6 text-purple-700" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">ចំនួនទឹកប្រាក់ដក</h2>
              <p className="text-gray-500 text-sm">តើអ្នកចង់ដកដើមទុនប៉ុន្មាន?</p>
            </div>
          </div>

          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">ចំនួនទឹកប្រាក់ ({memberSavings.currency})</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">{sym}</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                onWheel={(e) => e.currentTarget.blur()}
                placeholder="0.00"
                min="100"
                max={memberSavings.totalBalance}
                className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 text-lg font-semibold text-gray-900"
              />
            </div>
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>អប្បបរមា៖ {sym}១០០</span>
              <span>អតិបរមា៖ {formatMoney(memberSavings.totalBalance, memberSavings.currency)}</span>
            </div>
          </div>

          {withdrawAmount > 0 && (
            <div className="bg-purple-50 rounded-lg p-4 mb-5">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-purple-700">ចំនួនទឹកប្រាក់ដក</span>
                  <span className="font-semibold text-purple-900">{formatMoney(withdrawAmount, memberSavings.currency)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-purple-700">សមតុល្យនៅសល់</span>
                  <span className="font-semibold text-purple-900">
                    {formatMoney(memberSavings.totalBalance - withdrawAmount, memberSavings.currency)}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="bg-brand-50 rounded-lg p-3 mb-5 flex items-start gap-2">
            <Info className="w-4 h-4 text-brand-600 flex-shrink-0 mt-0.5" />
            <p className="text-brand-700 text-xs">
              ការដកគឺត្រូវការការទទួលយក។ ចំនួនទឹកប្រាក់ដែលបានទទួលយកត្រូវបានដំណើរការក្នុងអំឡុង ២០-២៥ មករា។
            </p>
          </div>

          <Button onClick={handleStep1Next} className="w-full" size="lg">បន្ត</Button>
        </Card>
      )}

      {/* Step 2: Fill Form */}
      {step === 2 && (
        <Card>
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2.5 bg-brand-100 rounded-lg">
              <Wallet className="w-6 h-6 text-brand-700" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">ព័ត៌មានលម្អិតការដក</h2>
              <p className="text-gray-500 text-sm">ផ្តល់ព័ត៌មានបន្ថែមសម្រាប់ការស្នើសុំរបស់អ្នក</p>
            </div>
          </div>

          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">មូលហេតុដក</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="សូមពិពណ៌នាមូលហេតុដែលអ្នកដកដើមទុនសន្សំរបស់អ្នក..."
              rows={4}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm resize-none"
            />
          </div>

          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              បន្ទាប់ពីការដក ខ្ញុំចង់៖
            </label>
            <div className="space-y-3">
              <button
                onClick={() => setAfterDecision('continue')}
                className={`w-full flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-colors ${
                  afterDecision === 'continue'
                    ? 'border-brand-900 bg-brand-50'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                  afterDecision === 'continue' ? 'border-brand-900 bg-brand-950' : 'border-gray-300'
                }`}>
                  {afterDecision === 'continue' && <div className="w-2 h-2 bg-white rounded-full" />}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <PiggyBank className="w-4 h-4 text-green-600" />
                    <p className="font-medium text-gray-900">បន្តសន្សំ</p>
                  </div>
                  <p className="text-gray-500 text-sm">
                    ដកដើមទុន ប៉ុន្តែនៅតែជាសមាជិកសកម្មរបស់សន្សំ និង បន្តសន្សំប្រចាំខែ។
                  </p>
                </div>
              </button>

              <button
                onClick={() => setAfterDecision('withdraw')}
                className={`w-full flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-colors ${
                  afterDecision === 'withdraw'
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                  afterDecision === 'withdraw' ? 'border-red-500 bg-red-500' : 'border-gray-300'
                }`}>
                  {afterDecision === 'withdraw' && <div className="w-2 h-2 bg-white rounded-full" />}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <XCircle className="w-4 h-4 text-red-600" />
                    <p className="font-medium text-gray-900">ឈប់ចូលជាសមាជិក</p>
                  </div>
                  <p className="text-gray-500 text-sm">
                    ដកដើមទុន និង បញ្ចប់ចូលជាសមាជិកសន្សំរបស់ខ្ញុំ។ សមតុល្យទាំងអស់នឹងត្រូវបានដោះស្រាយ។
                  </p>
                </div>
              </button>
            </div>
          </div>

          {afterDecision === 'withdraw' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-5">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-red-700 text-sm">
                  ការឈប់ចូលជាសមាជិកគឺអចិន្ត្រៃយ៍។ អ្នកនឹងបាត់បង់ការចូលប្រើ
                  សេវាសន្សំទាំងអស់រួមទាំងកម្មវិធីកម្ជី និង សន្សំ។ ដើម្បីចូលរួមឡើងវិញ អ្នកត្រូវ
                  ឆ្លងកាត់ដំណើរការចុះឈ្មោះពេញលេញម្តងទៀត។
                </p>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep(1)} className="flex-1">ត្រឡប់ក្រោយ</Button>
            <Button onClick={handleStep2Next} className="flex-1">បន្ត</Button>
          </div>
        </Card>
      )}

      {/* Step 3: Review */}
      {step === 3 && (
        <Card>
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2.5 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-700" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">ត្រួតពិនិត្យពាក្យសុំ</h2>
              <p className="text-gray-500 text-sm">បញ្ជាក់ការស្នើសុំដកដើមទុនរបស់អ្នក</p>
            </div>
          </div>

          <div className="space-y-3 mb-6">
            {[
              { label: 'ចំនួនទឹកប្រាក់ដក', value: formatMoney(withdrawAmount, memberSavings.currency) },
              { label: 'សមតុល្យបច្ចុប្បន្ន', value: formatMoney(memberSavings.totalBalance, memberSavings.currency) },
              { label: 'នៅសល់បន្ទាប់ពីដក', value: formatMoney(memberSavings.totalBalance - withdrawAmount, memberSavings.currency) },
              { label: 'មូលហេតុ', value: reason },
              { label: 'បន្ទាប់ពីការដក', value: afterDecision === 'continue' ? 'បន្តសន្សំ' : 'ឈប់ចូលជាសមាជិក' },
            ].map((item) => (
              <div key={item.label} className="flex items-start justify-between py-2.5 border-b border-gray-100">
                <span className="text-gray-500 text-sm">{item.label}</span>
                <span className={`text-sm font-medium text-right max-w-xs ${
                  item.label === 'បន្ទាប់ពីការដក' && afterDecision === 'withdraw' ? 'text-red-600' : 'text-gray-900'
                }`}>
                  {item.value}
                </span>
              </div>
            ))}
          </div>

          <div className="bg-brand-50 rounded-xl p-4 mb-5">
            <p className="text-brand-900 text-sm font-semibold mb-2">កាលវិភាគដំណើរការ</p>
            <div className="flex items-center gap-2 text-brand-700 text-sm">
              <Calendar className="w-4 h-4" />
              <p>
                ពាក្យសុំត្រូវបានត្រួតពិនិត្យ និង ការជូនដំណឹងផ្ញើក្នុងអំឡុង <strong>ថ្ងៃ ២០-២៥ មករា</strong>។
                ចំនួនទឹកប្រាក់ដែលទទួលយកត្រូវបានផ្ទេរនៅពេលនោះ។
              </p>
            </div>
          </div>

          {afterDecision === 'withdraw' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-5">
              <p className="text-red-800 text-sm font-medium mb-1">បញ្ជាក់ការបញ្ចប់ចូលជាសមាជិក</p>
              <p className="text-red-700 text-sm">
                ដោយដាក់ស្នើ អ្នកបញ្ជាក់ថាអ្នកចង់ឈប់ចូលជាសមាជិកសន្សំរបស់អ្នកអចិន្ត្រៃយ៍
                បន្ទាប់ពីការដកដើមទុន។ សកម្មភាពនេះមិនអាចលុបបានទេ។
              </p>
            </div>
          )}

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep(2)} disabled={loading} className="flex-1">ត្រឡប់ក្រោយ</Button>
            <Button
              onClick={handleSubmit}
              loading={loading}
              variant={afterDecision === 'withdraw' ? 'danger' : 'primary'}
              className="flex-1"
            >
              {afterDecision === 'withdraw' ? 'ដាក់ស្នើ និង ឈប់ចូលជាសមាជិក' : 'ដាក់ស្នើពាក្យសុំ'}
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
              ការស្នើសុំដកដើមទុនរបស់អ្នកចំនួន <strong>{formatMoney(withdrawAmount, memberSavings.currency)}</strong> ត្រូវបានដាក់ស្នើ។
            </p>
            <p className="text-gray-500 text-sm mb-6">
              អ្នកនឹងទទួលបានការជូនដំណឹងជាមួយការសម្រេចចិត្តក្នុងអំឡុង{' '}
              <strong>ថ្ងៃ ២០-២៥ មករា</strong>។ ចំនួនទឹកប្រាក់ដែលទទួលយកនឹងត្រូវផ្ទេរនៅពេលនោះ។
            </p>

            <div className="bg-brand-50 rounded-xl p-5 mb-6 text-left">
              <p className="text-brand-900 font-semibold text-sm mb-3">ព័ត៌មានលម្អិតពាក្យសុំ</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-brand-700">ចំនួនទឹកប្រាក់ស្នើសុំ</span>
                  <span className="font-medium text-brand-900">{formatMoney(withdrawAmount, memberSavings.currency)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-brand-700">បន្ទាប់ពីការដក</span>
                  <span className={`font-medium ${afterDecision === 'withdraw' ? 'text-red-600' : 'text-brand-900'}`}>
                    {afterDecision === 'continue' ? 'បន្តសន្សំ' : 'ឈប់ចូលជាសមាជិក'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-brand-700">ស្ថានភាព</span>
                  <span className="font-medium text-brand-900">កំពុងរង់ចាំការត្រួតពិនិត្យ</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3 justify-center">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 bg-brand-950 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-brand-800 transition-colors"
              >
                ត្រឡប់ក្រោយ <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </Card>
      )}
    </>
  )
}
