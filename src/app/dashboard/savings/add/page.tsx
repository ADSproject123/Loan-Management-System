'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Steps } from '@/components/ui/Steps'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { addSaving } from '@/app/actions/member'
import { showError } from '@/lib/toast'
import { currencySymbol, type CurrencyCode } from '@/lib/currency'
import { CurrencySelect } from '@/components/ui/CurrencySelect'
import {
  PiggyBank,
  QrCode,
  Upload,
  CheckCircle,
  ArrowLeft,
  Info,
} from 'lucide-react'

const STEPS = [
  { id: 1, label: 'ចំនួនទឹកប្រាក់', description: 'បញ្ចូលចំនួន' },
  { id: 2, label: 'QR Code', description: 'ស្កេន និង បង់' },
  { id: 3, label: 'ភស្តុតាង', description: 'ផ្ទុកភស្តុតាង' },
  { id: 4, label: 'រួចរាល់', description: 'បានបញ្ជាក់' },
]

export default function AddSavingPage() {
  const [step, setStep] = useState(1)
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState<CurrencyCode>('USD')
  const [notes, setNotes] = useState('')
  const [evidence, setEvidence] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const handleAmountNext = () => {
    const num = parseFloat(amount)
    if (!amount || isNaN(num) || num <= 0) {
      showError('សូមបញ្ចូលចំនួនទឹកប្រាក់សន្សំត្រឹមត្រូវ។')
      return
    }
    if (num < 100) {
      showError(`ចំនួនទឹកប្រាក់សន្សំអប្បបរមាគឺ ${currencySymbol(currency)}១០០។`)
      return
    }
    setStep(2)
  }

  const handleSubmitEvidence = async () => {
    if (!evidence) {
      showError('សូមផ្ទុកភស្តុតាងបង់ប្រាក់។')
      return
    }
    setLoading(true)

    const payload = new FormData()
    payload.append('amount', amount)
    payload.append('currency', currency)
    payload.append('notes', notes)
    payload.append('evidence', evidence)

    const result = await addSaving(payload)
    setLoading(false)

    if (!result.success) {
      showError(result.error ?? 'មិនអាចដាក់ស្នើការសន្សំបានទេ។')
      return
    }

    setStep(4)
  }

  return (
    <div className="p-6 md:p-8 w-full">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/dashboard/savings"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          ត្រឡប់ទៅការសន្សំ
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">ស្នើសុំការសន្សំ</h1>
        <p className="text-gray-500 text-sm mt-1">បន្ថែមការបរិច្ចាគសន្សំប្រចាំខែរបស់អ្នក</p>
      </div>

      {/* Steps */}
      <div className="mb-8">
        <Steps steps={STEPS} currentStep={step} />
      </div>

      {/* Step 1: Enter Amount */}
      {step === 1 && (
        <Card>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-green-100 rounded-lg">
              <PiggyBank className="w-6 h-6 text-green-700" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">បញ្ចូលចំនួនទឹកប្រាក់សន្សំ</h2>
              <p className="text-gray-500 text-sm">តើអ្នកចង់សន្សំប៉ុន្មានក្នុងខែនេះ?</p>
            </div>
          </div>

          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-2">ចំនួនទឹកប្រាក់ ({currency})</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">{currencySymbol(currency)}</span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  onWheel={(e) => e.currentTarget.blur()}
                  placeholder="0.00"
                  min="100"
                  step="100"
                  className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 text-lg font-semibold text-gray-900"
                />
              </div>
              <CurrencySelect value={currency} onChange={setCurrency} className="shrink-0" />
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">កំណត់ចំណាំ </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="ឧ. ការសន្សំប្រចាំខែឧសភា"
              className="w-full resize-y px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
            />
          </div>

          {amount && parseFloat(amount) > 0 && (
            <div className="bg-brand-50 rounded-lg p-4 mb-5">
              <div className="flex justify-between items-center">
                <span className="text-brand-700 text-sm">ចំនួនទឹកប្រាក់សន្សំ</span>
                <span className="text-brand-900 font-semibold">{currencySymbol(currency)}{parseFloat(amount).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center mt-1">
                <span className="text-brand-700 text-sm">ការប្រាក់ប្រចាំខែ (៣%)</span>
                <span className="text-green-600 font-semibold">+{currencySymbol(currency)}{(parseFloat(amount) * 0.03).toFixed(2)}</span>
              </div>
            </div>
          )}

          <Button onClick={handleAmountNext} className="w-full" size="lg">
            បន្តទៅការបង់ប្រាក់
          </Button>
        </Card>
      )}

      {/* Step 2: QR Code */}
      {step === 2 && (
        <Card>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-brand-100 rounded-lg">
              <QrCode className="w-6 h-6 text-brand-700" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">ស្កេន និង បង់ប្រាក់</h2>
              <p className="text-gray-500 text-sm">ស្កេន QR code ដើម្បីផ្ទេរចំនួនទឹកប្រាក់សន្សំ</p>
            </div>
          </div>

          <div className="text-center mb-6">
            <div className="bg-gray-100 rounded-xl p-8 inline-block mb-4">
              <div className="w-48 h-48 bg-white rounded-lg flex items-center justify-center border-2 border-gray-300">
                <QrCode className="w-32 h-32 text-gray-400" />
              </div>
            </div>
            <p className="font-semibold text-gray-900 text-lg">{currencySymbol(currency)}{parseFloat(amount).toLocaleString()}</p>
            <p className="text-gray-500 text-sm mt-1">ផ្ទេរចំនួនពិតប្រាកដនេះ</p>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-700">
                <p className="font-medium mb-1">សំខាន់៖</p>
                <ul className="space-y-1 list-disc list-inside text-xs">
                  <li>ផ្ទេរចំនួនពិតប្រាកដ <strong>{currencySymbol(currency)}{parseFloat(amount).toLocaleString()}</strong></li>
                  <li>ថតរូបអេក្រង់នៃការបញ្ជាក់ការផ្ទេរ</li>
                  <li>កុំបិទទំព័រនេះរហូតដល់អ្នកមានរូបអេក្រង់</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
              ត្រឡប់ក្រោយ
            </Button>
            <Button onClick={() => setStep(3)} className="flex-1">
              ខ្ញុំបានផ្ទេររួចហើយ
            </Button>
          </div>
        </Card>
      )}

      {/* Step 3: Upload Evidence */}
      {step === 3 && (
        <Card>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-orange-100 rounded-lg">
              <Upload className="w-6 h-6 text-orange-700" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">ដាក់ស្នើភស្តុតាងបង់ប្រាក់</h2>
              <p className="text-gray-500 text-sm">ផ្ទុករូបអេក្រង់នៃការបញ្ជាក់ការផ្ទេររបស់អ្នក</p>
            </div>
          </div>

          <div className="mb-6">
            <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-brand-500 hover:bg-brand-50 transition-colors">
              <Upload className="w-10 h-10 text-gray-400 mb-3" />
              {evidence ? (
                <div className="text-center">
                  <p className="text-sm font-medium text-brand-700">{evidence.name}</p>
                  <p className="text-xs text-gray-400 mt-1">ចុចដើម្បីប្តូរឯកសារ</p>
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

          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500">ចំនួនទឹកប្រាក់សន្សំ</span>
              <span className="font-semibold text-gray-900">{currencySymbol(currency)}{parseFloat(amount).toLocaleString()}</span>
            </div>
            {notes && (
              <div className="flex justify-between items-center text-sm mt-1">
                <span className="text-gray-500">កំណត់ចំណាំ</span>
                <span className="text-gray-700">{notes}</span>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep(2)} className="flex-1" disabled={loading}>
              ត្រឡប់ក្រោយ
            </Button>
            <Button onClick={handleSubmitEvidence} loading={loading} className="flex-1">
              ដាក់ស្នើភស្តុតាង
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
            <h2 className="text-2xl font-bold text-gray-900 mb-2">ការសន្សំបានដាក់ស្នើ!</h2>
            <p className="text-gray-600 mb-2">
              ការសន្សំរបស់អ្នកចំនួន <strong>{currencySymbol(currency)}{parseFloat(amount).toLocaleString()}</strong> ត្រូវបានដាក់ស្នើដោយជោគជ័យ។
            </p>
            <p className="text-gray-500 text-sm mb-6">
              អ្នកគ្រប់គ្រងនឹងផ្ទៀងផ្ទាត់ភស្តុតាងបង់ប្រាក់របស់អ្នកក្នុងរយៈពេល ២៤ ម៉ោង។
              សមតុល្យរបស់អ្នកនឹងត្រូវបានធ្វើបច្ចុប្បន្នភាពនៅពេលផ្ទៀងផ្ទាត់។
            </p>

            <div className="bg-green-50 rounded-xl p-4 mb-6 text-left">
              <p className="text-green-900 font-semibold text-sm mb-2">សង្ខេបការដាក់ស្នើ</p>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-green-700">ចំនួនទឹកប្រាក់</span>
                  <span className="font-medium text-green-900">{currencySymbol(currency)}{parseFloat(amount).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-green-700">ស្ថានភាព</span>
                  <span className="font-medium text-green-900">កំពុងរង់ចាំការផ្ទៀងផ្ទាត់</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-green-700">ការផ្ទៀងផ្ទាត់ដែលរំពឹងទុក</span>
                  <span className="font-medium text-green-900">ក្នុងរយៈពេល ២៤ ម៉ោង</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Link
                href="/dashboard/savings"
                className="flex-1 inline-flex items-center justify-center gap-2 bg-brand-950 text-white py-2.5 rounded-lg font-semibold hover:bg-brand-800 transition-colors text-sm"
              >
                មើលការសន្សំ
              </Link>
              <Link
                href="/dashboard"
                className="flex-1 inline-flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-700 py-2.5 rounded-lg font-semibold hover:bg-gray-50 transition-colors text-sm"
              >
                ផ្ទាំងគ្រប់គ្រង
              </Link>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
