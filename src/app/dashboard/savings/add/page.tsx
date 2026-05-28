'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Steps } from '@/components/ui/Steps'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { addSaving } from '@/app/actions/member'
import {
  PiggyBank,
  QrCode,
  Upload,
  CheckCircle,
  ArrowLeft,
  AlertCircle,
  Info,
} from 'lucide-react'

const STEPS = [
  { id: 1, label: 'Amount', description: 'Enter amount' },
  { id: 2, label: 'QR Code', description: 'Scan & pay' },
  { id: 3, label: 'Evidence', description: 'Upload proof' },
  { id: 4, label: 'Done', description: 'Confirmed' },
]

export default function AddSavingPage() {
  const [step, setStep] = useState(1)
  const [amount, setAmount] = useState('')
  const [notes, setNotes] = useState('')
  const [evidence, setEvidence] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleAmountNext = () => {
    const num = parseFloat(amount)
    if (!amount || isNaN(num) || num <= 0) {
      setError('Please enter a valid saving amount.')
      return
    }
    if (num < 100) {
      setError('Minimum saving amount is ฿100.')
      return
    }
    setError(null)
    setStep(2)
  }

  const handleSubmitEvidence = async () => {
    if (!evidence) {
      setError('Please upload payment evidence.')
      return
    }
    setLoading(true)
    setError(null)

    const payload = new FormData()
    payload.append('amount', amount)
    payload.append('notes', notes)
    payload.append('evidence', evidence)

    const result = await addSaving(payload)
    setLoading(false)

    if (!result.success) {
      setError(result.error ?? 'Unable to submit saving.')
      return
    }

    setStep(4)
  }

  const suggestedAmounts = [1000, 2000, 3000, 5000, 10000]

  return (
    <div className="p-6 md:p-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/dashboard/savings"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Savings
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Add Monthly Saving</h1>
        <p className="text-gray-500 text-sm mt-1">Add your monthly saving contribution</p>
      </div>

      {/* Steps */}
      <div className="mb-8">
        <Steps steps={STEPS} currentStep={step} />
      </div>

      {/* Error */}
      {error && (
        <div className="mb-5 flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Step 1: Enter Amount */}
      {step === 1 && (
        <Card>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-green-100 rounded-lg">
              <PiggyBank className="w-6 h-6 text-green-700" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">Enter Saving Amount</h2>
              <p className="text-gray-500 text-sm">How much would you like to save this month?</p>
            </div>
          </div>

          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-2">Amount (฿)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">฿</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                min="100"
                step="100"
                className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg font-semibold text-gray-900"
              />
            </div>
          </div>

          <div className="mb-5">
            <p className="text-sm text-gray-500 mb-2">Quick amounts:</p>
            <div className="flex flex-wrap gap-2">
              {suggestedAmounts.map((amt) => (
                <button
                  key={amt}
                  onClick={() => setAmount(amt.toString())}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
                    amount === amt.toString()
                      ? 'bg-blue-900 text-white border-blue-900'
                      : 'border-gray-300 text-gray-700 hover:border-blue-400 hover:text-blue-700'
                  }`}
                >
                  ฿{amt.toLocaleString()}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Notes (optional)</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. May monthly saving"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          {amount && parseFloat(amount) > 0 && (
            <div className="bg-blue-50 rounded-lg p-4 mb-5">
              <div className="flex justify-between items-center">
                <span className="text-blue-700 text-sm">Saving amount</span>
                <span className="text-blue-900 font-semibold">฿{parseFloat(amount).toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center mt-1">
                <span className="text-blue-700 text-sm">Monthly interest (3%)</span>
                <span className="text-green-600 font-semibold">+฿{(parseFloat(amount) * 0.03).toFixed(2)}</span>
              </div>
            </div>
          )}

          <Button onClick={handleAmountNext} className="w-full" size="lg">
            Continue to Payment
          </Button>
        </Card>
      )}

      {/* Step 2: QR Code */}
      {step === 2 && (
        <Card>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-blue-100 rounded-lg">
              <QrCode className="w-6 h-6 text-blue-700" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">Scan & Pay</h2>
              <p className="text-gray-500 text-sm">Scan the QR code to transfer your saving amount</p>
            </div>
          </div>

          <div className="text-center mb-6">
            <div className="bg-gray-100 rounded-xl p-8 inline-block mb-4">
              <div className="w-48 h-48 bg-white rounded-lg flex items-center justify-center border-2 border-gray-300">
                <QrCode className="w-32 h-32 text-gray-400" />
              </div>
            </div>
            <p className="font-semibold text-gray-900 text-lg">฿{parseFloat(amount).toLocaleString()}</p>
            <p className="text-gray-500 text-sm mt-1">Transfer exactly this amount</p>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-700">
                <p className="font-medium mb-1">Important:</p>
                <ul className="space-y-1 list-disc list-inside text-xs">
                  <li>Transfer exactly <strong>฿{parseFloat(amount).toLocaleString()}</strong></li>
                  <li>Take a screenshot of the transfer confirmation</li>
                  <li>Do not close this page until you have the screenshot</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
              Back
            </Button>
            <Button onClick={() => setStep(3)} className="flex-1">
              I&apos;ve Made the Transfer
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
              <h2 className="font-semibold text-gray-900">Submit Payment Evidence</h2>
              <p className="text-gray-500 text-sm">Upload a screenshot of your transfer confirmation</p>
            </div>
          </div>

          <div className="mb-6">
            <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
              <Upload className="w-10 h-10 text-gray-400 mb-3" />
              {evidence ? (
                <div className="text-center">
                  <p className="text-sm font-medium text-blue-700">{evidence.name}</p>
                  <p className="text-xs text-gray-400 mt-1">Click to change file</p>
                </div>
              ) : (
                <>
                  <p className="text-sm font-medium text-gray-600">Click to upload evidence</p>
                  <p className="text-xs text-gray-400 mt-1">JPG, PNG or PDF, max 10MB</p>
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
              <span className="text-gray-500">Saving amount</span>
              <span className="font-semibold text-gray-900">฿{parseFloat(amount).toLocaleString()}</span>
            </div>
            {notes && (
              <div className="flex justify-between items-center text-sm mt-1">
                <span className="text-gray-500">Notes</span>
                <span className="text-gray-700">{notes}</span>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep(2)} className="flex-1" disabled={loading}>
              Back
            </Button>
            <Button onClick={handleSubmitEvidence} loading={loading} className="flex-1">
              Submit Evidence
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
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Saving Submitted!</h2>
            <p className="text-gray-600 mb-2">
              Your saving of <strong>฿{parseFloat(amount).toLocaleString()}</strong> has been submitted successfully.
            </p>
            <p className="text-gray-500 text-sm mb-6">
              An admin will verify your payment evidence within 24 hours.
              Your balance will be updated upon verification.
            </p>

            <div className="bg-green-50 rounded-xl p-4 mb-6 text-left">
              <p className="text-green-900 font-semibold text-sm mb-2">Submission Summary</p>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-green-700">Amount</span>
                  <span className="font-medium text-green-900">฿{parseFloat(amount).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-green-700">Status</span>
                  <span className="font-medium text-green-900">Pending Verification</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-green-700">Expected Verification</span>
                  <span className="font-medium text-green-900">Within 24 hours</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Link
                href="/dashboard/savings"
                className="flex-1 inline-flex items-center justify-center gap-2 bg-blue-900 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-800 transition-colors text-sm"
              >
                View Savings
              </Link>
              <Link
                href="/dashboard"
                className="flex-1 inline-flex items-center justify-center gap-2 border border-gray-300 text-gray-700 py-2.5 rounded-lg font-semibold hover:bg-gray-50 transition-colors text-sm"
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
