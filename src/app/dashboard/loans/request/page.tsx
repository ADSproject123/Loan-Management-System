'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Steps } from '@/components/ui/Steps'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
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
  { id: 1, label: 'Loan Details', description: 'Amount & purpose' },
  { id: 2, label: 'Documents', description: 'Upload files' },
  { id: 3, label: 'Referee', description: 'Verification' },
  { id: 4, label: 'Review', description: 'Confirm & submit' },
  { id: 5, label: 'Done', description: 'Submitted' },
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
        setError('Please enter a valid loan amount.')
        return false
      }
      if (!formData.purpose.trim()) {
        setError('Please describe the purpose of your loan.')
        return false
      }
    }
    if (step === 3 && !formData.referee_email.trim()) {
      setError('Please enter your referee\'s email address.')
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
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setLoading(false)
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
          Back to Loans
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Request a Loan</h1>
        <p className="text-gray-500 text-sm mt-1">Complete the form to submit your loan application</p>
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
              <h2 className="font-semibold text-gray-900">Loan Details</h2>
              <p className="text-gray-500 text-sm">Tell us about your loan request</p>
            </div>
          </div>

          <div className="space-y-4 mb-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Loan Amount (฿)</label>
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
              <p className="text-gray-400 text-xs mt-1">Maximum loan amount depends on your savings balance</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Loan Purpose</label>
              <textarea
                value={formData.purpose}
                onChange={(e) => update('purpose', e.target.value)}
                placeholder="Describe the reason for your loan request..."
                rows={3}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Loan Term</label>
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
                    {months} mo
                  </button>
                ))}
              </div>
            </div>
          </div>

          {loanAmount > 0 && (
            <div className="bg-blue-50 rounded-xl p-4 mb-5">
              <p className="text-blue-900 font-semibold text-sm mb-3">Loan Estimate</p>
              <div className="space-y-2">
                {[
                  { label: 'Loan Amount', value: `฿${loanAmount.toLocaleString()}` },
                  { label: 'Interest Rate', value: '2% per month' },
                  { label: 'Monthly Interest', value: `฿${monthlyInterest.toLocaleString()}` },
                  { label: 'Est. Monthly Payment', value: `฿${monthlyPayment.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}` },
                  { label: 'Total Repayment', value: `฿${totalRepayment.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}` },
                ].map((item) => (
                  <div key={item.label} className="flex justify-between text-sm">
                    <span className="text-blue-700">{item.label}</span>
                    <span className="font-medium text-blue-900">{item.value}</span>
                  </div>
                ))}
              </div>
              <p className="text-blue-500 text-xs mt-3">* Estimates based on standard 2% monthly rate</p>
            </div>
          )}

          <Button onClick={handleNext} className="w-full" size="lg">
            Continue
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
              <h2 className="font-semibold text-gray-900">Supporting Documents</h2>
              <p className="text-gray-500 text-sm">Upload documents to support your loan application</p>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-5">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-700">
                <p className="font-medium mb-1">Required Documents:</p>
                <ul className="space-y-1 list-disc list-inside text-xs">
                  <li>Proof of income or employment</li>
                  <li>Statement of purpose / business plan (for business loans)</li>
                  <li>Any supporting financial documents</li>
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
                  <p className="text-xs text-gray-400 mt-1">Click to change file</p>
                </div>
              ) : (
                <>
                  <p className="text-sm font-medium text-gray-600">Click to upload supporting document</p>
                  <p className="text-xs text-gray-400 mt-1">JPG, PNG or PDF, max 10MB</p>
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
              <strong>Note:</strong> Hard copy documents with thumbprints must be submitted to the SanSam
              office after your loan is approved. This is required before disbursement.
            </p>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep(1)} className="flex-1">Back</Button>
            <Button onClick={handleNext} className="flex-1">Continue</Button>
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
              <h2 className="font-semibold text-gray-900">Referee Verification</h2>
              <p className="text-gray-500 text-sm">A SanSam member must verify your loan request</p>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-5">
            <p className="text-blue-900 text-sm font-medium mb-1">Why a Referee?</p>
            <p className="text-blue-700 text-sm">
              Your referee is a trusted SanSam member who vouches for your loan application.
              They will receive an email verification request and must approve before your
              application proceeds to committee review.
            </p>
          </div>

          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Referee&apos;s Email Address</label>
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
              Your referee will receive an email notification with a verification link.
            </p>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep(2)} className="flex-1">Back</Button>
            <Button onClick={handleNext} className="flex-1">Continue</Button>
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
              <h2 className="font-semibold text-gray-900">Review & Submit</h2>
              <p className="text-gray-500 text-sm">Please review your application before submitting</p>
            </div>
          </div>

          <div className="space-y-3 mb-6">
            {[
              { label: 'Loan Amount', value: `฿${loanAmount.toLocaleString()}` },
              { label: 'Purpose', value: formData.purpose },
              { label: 'Term', value: `${formData.term_months} months` },
              { label: 'Interest Rate', value: '2% per month' },
              { label: 'Supporting Document', value: formData.support_document?.name || 'None uploaded' },
              { label: 'Referee Email', value: formData.referee_email },
            ].map((item) => (
              <div key={item.label} className="flex items-start justify-between py-2.5 border-b border-gray-100">
                <span className="text-gray-500 text-sm">{item.label}</span>
                <span className="text-gray-900 text-sm font-medium text-right max-w-xs truncate">{item.value}</span>
              </div>
            ))}
          </div>

          <div className="bg-blue-50 rounded-xl p-4 mb-5">
            <p className="text-blue-900 text-sm font-semibold mb-2">What happens next?</p>
            <div className="space-y-2">
              {[
                'Referee receives verification email',
                'Referee approves your application',
                'Committee reviews within 1-3 business days',
                'You receive approval notification',
                'Submit hard copy documents with thumbprints to office',
                'Loan is disbursed to your account',
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <span className="w-5 h-5 bg-blue-900 text-white rounded-full flex items-center justify-center text-xs flex-shrink-0 mt-0.5">{i + 1}</span>
                  <span className="text-blue-700">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep(3)} className="flex-1" disabled={loading}>Back</Button>
            <Button onClick={handleSubmit} loading={loading} className="flex-1">
              Submit Application
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
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Application Submitted!</h2>
            <p className="text-gray-600 mb-2">
              Your loan application for <strong>฿{loanAmount.toLocaleString()}</strong> has been submitted.
            </p>
            <p className="text-gray-500 text-sm mb-6">
              Your referee will receive a verification email. Once verified, the committee will review
              your application within 1-3 business days.
            </p>

            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6 text-left">
              <p className="text-yellow-900 font-semibold text-sm mb-2">Important Reminder</p>
              <p className="text-yellow-700 text-sm">
                Upon loan approval, you must submit hard copy documents with thumbprints to the
                SanSam office. The loan will not be disbursed until hard copy documents are received.
              </p>
            </div>

            <div className="flex gap-3 justify-center">
              <Link
                href="/dashboard/loans"
                className="inline-flex items-center gap-2 bg-blue-900 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-800 transition-colors"
              >
                View My Loans
              </Link>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 border border-gray-300 text-gray-700 px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors"
              >
                Dashboard
              </Link>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
