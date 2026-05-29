'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Steps } from '@/components/ui/Steps'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { requestLoan } from '@/app/actions/member'
import {
  ArrowLeft,
  CreditCard,
  Upload,
  Users,
  CheckCircle,
  AlertCircle,
  Info,
  FileText,
  Mail,
} from 'lucide-react'

const STEPS = [
  { id: 1, label: 'ព័ត៌មានឥណទាន', description: 'ចំនួន និង គោលបំណង' },
  { id: 2, label: 'ឯកសារ', description: 'ផ្ទុកឯកសារ' },
  { id: 3, label: 'អ្នកធានា', description: 'ការផ្ទៀងផ្ទាត់' },
  { id: 4, label: 'ត្រួតពិនិត្យ', description: 'បញ្ជាក់ និង ដាក់ស្នើ' },
  { id: 5, label: 'រួចរាល់', description: 'បានដាក់ស្នើ' },
]

interface LoanFormData {
  amount: string
  purpose: string
  term_months: string
  referee_email: string
  support_document: File | null
}

export default function LoanRequestPage() {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState<LoanFormData>({
    amount: '',
    purpose: '',
    term_months: '12',
    referee_email: '',
    support_document: null,
  })

  const update = (field: keyof LoanFormData, value: string | File | null) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const validate = () => {
    if (step === 1) {
      const amt = parseFloat(formData.amount)
      if (!formData.amount || isNaN(amt) || amt <= 0) {
        setError('សូមបញ្ចូលចំនួនទឹកប្រាក់ឥណទានត្រឹមត្រូវ។')
        return false
      }
      if (!formData.purpose.trim()) {
        setError('សូមពិពណ៌នាគោលបំណងនៃឥណទានរបស់អ្នក។')
        return false
      }
    }
    if (step === 3 && !formData.referee_email.trim()) {
      setError('សូមបញ្ចូលអាសយដ្ឋានអ៊ីមែលរបស់អ្នកធានា។')
      return false
    }
    return true
  }

  const handleNext = () => {
    setError(null)
    if (!validate()) return
    setStep((prev) => Math.min(prev + 1, 5))
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError(null)

    const payload = new FormData()
    payload.append('amount', formData.amount)
    payload.append('purpose', formData.purpose)
    payload.append('term_months', formData.term_months)
    payload.append('referee_email', formData.referee_email)
    if (formData.support_document) {
      payload.append('support_document', formData.support_document)
    }

    const result = await requestLoan(payload)
    setLoading(false)

    if (!result.success) {
      setError(result.error ?? 'មិនអាចដាក់ស្នើពាក្យសុំឥណទានបានទេ។')
      return
    }

    setStep(5)
  }

  const loanAmount = parseFloat(formData.amount) || 0
  const monthlyInterest = loanAmount * 0.02
  const monthlyPayment = loanAmount / parseInt(formData.term_months || '12') + monthlyInterest
  const totalRepayment = loanAmount + (monthlyInterest * parseInt(formData.term_months || '12'))

  return (
    <div className="p-6 md:p-8 max-w-2xl mx-auto">
      <div className="mb-6">
        <Link
          href="/dashboard/loans"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          ត្រឡប់ទៅឥណទាន
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">ស្នើសុំឥណទាន</h1>
        <p className="text-gray-500 text-sm mt-1">បំពេញបែបបទដើម្បីដាក់ស្នើពាក្យសុំឥណទានរបស់អ្នក</p>
      </div>

      {step < 5 && (
        <div className="mb-8">
          <Steps steps={STEPS} currentStep={step} />
        </div>
      )}

      {error && (
        <div className="mb-5 flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Step 1: Loan Details */}
      {step === 1 && (
        <Card>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-blue-100 rounded-lg">
              <CreditCard className="w-6 h-6 text-blue-700" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">ព័ត៌មានឥណទាន</h2>
              <p className="text-gray-500 text-sm">ប្រាប់យើងអំពីការស្នើសុំឥណទានរបស់អ្នក</p>
            </div>
          </div>

          <div className="space-y-4 mb-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">ចំនួនទឹកប្រាក់ឥណទាន (฿)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">฿</span>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => update('amount', e.target.value)}
                  placeholder="0.00"
                  min="1000"
                  step="1000"
                  className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg font-semibold text-gray-900"
                />
              </div>
              <p className="text-gray-400 text-xs mt-1">ចំនួនទឹកប្រាក់ឥណទានអតិបរមាអាស្រ័យលើសមតុល្យសន្សំរបស់អ្នក</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">គោលបំណងឥណទាន</label>
              <textarea
                value={formData.purpose}
                onChange={(e) => update('purpose', e.target.value)}
                placeholder="ពិពណ៌នាមូលហេតុនៃការស្នើសុំឥណទានរបស់អ្នក..."
                rows={3}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">រយៈពេលឥណទាន</label>
              <div className="grid grid-cols-4 gap-2">
                {['6', '12', '18', '24'].map((months) => (
                  <button
                    key={months}
                    onClick={() => update('term_months', months)}
                    className={`py-2 rounded-lg text-sm font-medium transition-colors border ${
                      formData.term_months === months
                        ? 'bg-blue-900 text-white border-blue-900'
                        : 'border-gray-300 text-gray-700 hover:border-blue-400 hover:text-blue-700'
                    }`}
                  >
                    {months} ខែ
                  </button>
                ))}
              </div>
            </div>
          </div>

          {loanAmount > 0 && (
            <div className="bg-blue-50 rounded-xl p-4 mb-5">
              <p className="text-blue-900 font-semibold text-sm mb-3">ការប៉ាន់ប្រមាណឥណទាន</p>
              <div className="space-y-2">
                {[
                  { label: 'ចំនួនទឹកប្រាក់ឥណទាន', value: `฿${loanAmount.toLocaleString()}` },
                  { label: 'អត្រាការប្រាក់', value: '២% ក្នុងមួយខែ' },
                  { label: 'ការប្រាក់ប្រចាំខែ', value: `฿${monthlyInterest.toLocaleString()}` },
                  { label: 'ប្រាក់សងប្រមាណប្រចាំខែ', value: `฿${monthlyPayment.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}` },
                  { label: 'ការសងសរុប', value: `฿${totalRepayment.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}` },
                ].map((item) => (
                  <div key={item.label} className="flex justify-between text-sm">
                    <span className="text-blue-700">{item.label}</span>
                    <span className="font-medium text-blue-900">{item.value}</span>
                  </div>
                ))}
              </div>
              <p className="text-blue-500 text-xs mt-3">* ការប៉ាន់ប្រមាណផ្អែកលើអត្រាស្តង់ដារ ២% ក្នុងមួយខែ</p>
            </div>
          )}

          <Button onClick={handleNext} className="w-full" size="lg">
            បន្ត
          </Button>
        </Card>
      )}

      {/* Step 2: Documents */}
      {step === 2 && (
        <Card>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-orange-100 rounded-lg">
              <FileText className="w-6 h-6 text-orange-700" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">ឯកសារគាំទ្រ</h2>
              <p className="text-gray-500 text-sm">ផ្ទុកឯកសារដើម្បីគាំទ្រពាក្យសុំឥណទានរបស់អ្នក</p>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-5">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-700">
                <p className="font-medium mb-1">ឯកសារដែលត្រូវការ៖</p>
                <ul className="space-y-1 list-disc list-inside text-xs">
                  <li>ភស្តុតាងចំណូល ឬ ការងារ</li>
                  <li>សេចក្តីបញ្ជាក់គោលបំណង / ផែនការអាជីវកម្ម (សម្រាប់ឥណទានអាជីវកម្ម)</li>
                  <li>ឯកសារហិរញ្ញវត្ថុគាំទ្រណាមួយ</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mb-5">
            <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
              <Upload className="w-10 h-10 text-gray-400 mb-3" />
              {formData.support_document ? (
                <div className="text-center">
                  <p className="text-sm font-medium text-blue-700">{formData.support_document.name}</p>
                  <p className="text-xs text-gray-400 mt-1">ចុចដើម្បីប្តូរឯកសារ</p>
                </div>
              ) : (
                <>
                  <p className="text-sm font-medium text-gray-600">ចុចដើម្បីផ្ទុកឯកសារគាំទ្រ</p>
                  <p className="text-xs text-gray-400 mt-1">JPG, PNG ឬ PDF អតិបរមា ១០ មេកាបៃ</p>
                </>
              )}
              <input
                type="file"
                accept="image/*,.pdf"
                className="hidden"
                onChange={(e) => update('support_document', e.target.files?.[0] ?? null)}
              />
            </label>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-5">
            <p className="text-yellow-800 text-sm">
              <strong>ចំណាំ៖</strong> ឯកសារច្បាប់ដើមជាមួយការផ្តិតមេដៃត្រូវដាក់ស្នើទៅការិយាល័យសន្សំ
              បន្ទាប់ពីឥណទានរបស់អ្នកត្រូវបានអនុម័ត។ នេះតម្រូវឱ្យធ្វើមុនការបើកប្រាក់ឥណទាន។
            </p>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep(1)} className="flex-1">ត្រឡប់ក្រោយ</Button>
            <Button onClick={handleNext} className="flex-1">បន្ត</Button>
          </div>
        </Card>
      )}

      {/* Step 3: Referee */}
      {step === 3 && (
        <Card>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-purple-100 rounded-lg">
              <Users className="w-6 h-6 text-purple-700" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">ការផ្ទៀងផ្ទាត់អ្នកធានា</h2>
              <p className="text-gray-500 text-sm">សមាជិកសន្សំត្រូវផ្ទៀងផ្ទាត់ការស្នើសុំឥណទានរបស់អ្នក</p>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-5">
            <p className="text-blue-900 text-sm font-medium mb-1">ហេតុអ្វីត្រូវការអ្នកធានា?</p>
            <p className="text-blue-700 text-sm">
              អ្នកធានាគឺជាសមាជិកសន្សំដែលជឿទុកចិត្តបានដែលធានាជូនពាក្យសុំឥណទានរបស់អ្នក។
              ពួកគេនឹងទទួលបានសំណើផ្ទៀងផ្ទាត់តាមអ៊ីមែល និង ត្រូវអនុម័តមុនពេលពាក្យសុំ
              របស់អ្នកបន្តទៅការត្រួតពិនិត្យដោយគណៈកម្មាធិការ។
            </p>
          </div>

          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">អាសយដ្ឋានអ៊ីមែលរបស់អ្នកធានា</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                value={formData.referee_email}
                onChange={(e) => update('referee_email', e.target.value)}
                placeholder="referee@example.com"
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
            <p className="text-gray-400 text-xs mt-2">
              អ្នកធានារបស់អ្នកនឹងទទួលបានការជូនដំណឹងតាមអ៊ីមែលជាមួយតំណផ្ទៀងផ្ទាត់។
            </p>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep(2)} className="flex-1">ត្រឡប់ក្រោយ</Button>
            <Button onClick={handleNext} className="flex-1">បន្ត</Button>
          </div>
        </Card>
      )}

      {/* Step 4: Review */}
      {step === 4 && (
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
              { label: 'ចំនួនទឹកប្រាក់ឥណទាន', value: `฿${loanAmount.toLocaleString()}` },
              { label: 'គោលបំណង', value: formData.purpose },
              { label: 'រយៈពេល', value: `${formData.term_months} ខែ` },
              { label: 'អត្រាការប្រាក់', value: '២% ក្នុងមួយខែ' },
              { label: 'ឯកសារគាំទ្រ', value: formData.support_document?.name || 'មិនបានផ្ទុក' },
              { label: 'អ៊ីមែលអ្នកធានា', value: formData.referee_email },
            ].map((item) => (
              <div key={item.label} className="flex items-start justify-between py-2.5 border-b border-gray-100">
                <span className="text-gray-500 text-sm">{item.label}</span>
                <span className="text-gray-900 text-sm font-medium text-right max-w-xs truncate">{item.value}</span>
              </div>
            ))}
          </div>

          <div className="bg-blue-50 rounded-xl p-4 mb-5">
            <p className="text-blue-900 text-sm font-semibold mb-2">តើនឹងមានអ្វីកើតឡើងបន្ទាប់?</p>
            <div className="space-y-2">
              {[
                'អ្នកធានាទទួលបានអ៊ីមែលផ្ទៀងផ្ទាត់',
                'អ្នកធានាអនុម័តពាក្យសុំរបស់អ្នក',
                'គណៈកម្មាធិការត្រួតពិនិត្យក្នុងរយៈពេល ១-៣ ថ្ងៃធ្វើការ',
                'អ្នកទទួលបានការជូនដំណឹងពីការអនុម័ត',
                'ដាក់ស្នើឯកសារច្បាប់ដើមជាមួយការផ្តិតមេដៃទៅការិយាល័យ',
                'ឥណទានត្រូវបានបើកទៅគណនីរបស់អ្នក',
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <span className="w-5 h-5 bg-blue-900 text-white rounded-full flex items-center justify-center text-xs flex-shrink-0 mt-0.5">{i + 1}</span>
                  <span className="text-blue-700">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep(3)} className="flex-1" disabled={loading}>ត្រឡប់ក្រោយ</Button>
            <Button onClick={handleSubmit} loading={loading} className="flex-1">
              ដាក់ស្នើពាក្យសុំ
            </Button>
          </div>
        </Card>
      )}

      {/* Step 5: Success */}
      {step === 5 && (
        <Card>
          <div className="text-center py-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">ពាក្យសុំត្រូវបានដាក់ស្នើ!</h2>
            <p className="text-gray-600 mb-2">
              ពាក្យសុំឥណទានរបស់អ្នកសម្រាប់ <strong>฿{loanAmount.toLocaleString()}</strong> ត្រូវបានដាក់ស្នើ។
            </p>
            <p className="text-gray-500 text-sm mb-6">
              អ្នកធានារបស់អ្នកនឹងទទួលបានអ៊ីមែលផ្ទៀងផ្ទាត់។ បន្ទាប់ពីបានផ្ទៀងផ្ទាត់ គណៈកម្មាធិការនឹង
              ត្រួតពិនិត្យពាក្យសុំរបស់អ្នកក្នុងរយៈពេល ១-៣ ថ្ងៃធ្វើការ។
            </p>

            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6 text-left">
              <p className="text-yellow-900 font-semibold text-sm mb-2">ការរំលឹកសំខាន់</p>
              <p className="text-yellow-700 text-sm">
                នៅពេលអនុម័តឥណទាន អ្នកត្រូវដាក់ស្នើឯកសារច្បាប់ដើមជាមួយការផ្តិតមេដៃទៅ
                ការិយាល័យសន្សំ។ ឥណទាននឹងមិនត្រូវបានបើកទេរហូតដល់ឯកសារច្បាប់ដើមត្រូវបានទទួល។
              </p>
            </div>

            <div className="flex gap-3 justify-center">
              <Link
                href="/dashboard/loans"
                className="inline-flex items-center gap-2 bg-blue-900 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-800 transition-colors"
              >
                មើលឥណទានរបស់ខ្ញុំ
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 border border-gray-300 text-gray-700 px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors"
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
