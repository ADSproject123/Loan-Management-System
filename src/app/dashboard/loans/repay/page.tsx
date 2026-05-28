'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Steps } from '@/components/ui/Steps'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { repayLoan } from '@/app/actions/member'
import { ArrowLeft, CreditCard, QrCode, Upload, CheckCircle, AlertCircle, Info } from 'lucide-react'

const STEPS = [
  { id: 1, label: 'Confirm Amount', description: 'Set amount' },
  { id: 2, label: 'QR Code', description: 'Scan & pay' },
  { id: 3, label: 'Evidence', description: 'Upload proof' },
  { id: 4, label: 'Done', description: 'Submitted' },
]

// Mock active loan data
const activeLoan = {
  id: '1',
  amount: 50000,
  remaining: 30000,
  monthly_payment: 5000,
  purpose: 'Business expansion',
  due_date: '2025-06-01',
}

export default function LoanRepayPage() {
  const [step, setStep] = useState(1)
  const [payAmount, setPayAmount] = useState(activeLoan.monthly_payment.toString())
  const [evidence, setEvidence] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleConfirmAmount = () => {
    const amt = parseFloat(payAmount)
    if (!payAmount || isNaN(amt) || amt <= 0) {
      setError('Please enter a valid payment amount.')
      return
    }
    if (amt > activeLoan.remaining) {
      setError(`Amount cannot exceed remaining loan balance of ฿${activeLoan.remaining.toLocaleString()}.`)
      return
    }
    setError(null)
    setStep(2)
  }

  const handleSubmit = async () => {
    if (!evidence) {
      setError('Please upload payment evidence.')
      return
    }
    setLoading(true)
    setError(null)

    const payload = new FormData()
    payload.append('amount', payAmount)
    payload.append('evidence', evidence)

    const result = await repayLoan(payload)
    setLoading(false)

    if (!result.success) {
      setError(result.error ?? 'Unable to submit repayment.')
      return
    }

    setStep(4)
  }

  const amount = parseFloat(payAmount) || 0
  const newRemaining = activeLoan.remaining - amount

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
        <h1 className="text-2xl font-bold text-gray-900">Loan Repayment</h1>
        <p className="text-gray-500 text-sm mt-1">Make a payment toward your active loan</p>
      </div>

      {step < 4 && (
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

      {/* Active Loan Summary */}
      {step < 4 && (
        <div className="bg-gradient-to-r from-blue-900 to-blue-700 text-white rounded-xl p-5 mb-6">
          <p className="text-blue-200 text-xs uppercase tracking-wider font-semibold mb-2">Active Loan</p>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-2xl font-bold">฿{activeLoan.remaining.toLocaleString()}</p>
              <p className="text-blue-200 text-sm mt-1">Remaining balance</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-semibold">฿{activeLoan.monthly_payment.toLocaleString()}</p>
              <p className="text-blue-200 text-sm mt-1">Monthly payment</p>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-white/20">
            <p className="text-blue-200 text-xs">
              {activeLoan.purpose} &bull; Due {new Date(activeLoan.due_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
        </div>
      )}

      {/* Step 1: Confirm Amount */}
      {step === 1 && (
        <Card>
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2.5 bg-blue-100 rounded-lg">
              <CreditCard className="w-6 h-6 text-blue-700" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">Confirm Repayment Amount</h2>
              <p className="text-gray-500 text-sm">How much would you like to pay?</p>
            </div>
          </div>

          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Payment Amount (฿)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">฿</span>
              <input
                type="number"
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                placeholder="0.00"
                min="100"
                max={activeLoan.remaining}
                className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg font-semibold text-gray-900"
              />
            </div>
          </div>

          <div className="flex gap-2 mb-5">
            {[activeLoan.monthly_payment, activeLoan.monthly_payment * 2, activeLoan.remaining].map((amt, i) => (
              <button
                key={i}
                onClick={() => setPayAmount(amt.toString())}
                className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors border ${
                  parseFloat(payAmount) === amt
                    ? 'bg-blue-900 text-white border-blue-900'
                    : 'border-gray-300 text-gray-700 hover:border-blue-400 hover:text-blue-700'
                }`}
              >
                {i === 0 ? 'Monthly' : i === 1 ? 'Double' : 'Full'}
                <br />
                ฿{amt.toLocaleString()}
              </button>
            ))}
          </div>

          {amount > 0 && (
            <div className="bg-blue-50 rounded-lg p-4 mb-5">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-blue-700">Payment amount</span>
                  <span className="font-semibold text-blue-900">฿{amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700">Current remaining</span>
                  <span className="font-semibold text-blue-900">฿{activeLoan.remaining.toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-t border-blue-200 pt-2">
                  <span className="text-blue-700 font-medium">New remaining</span>
                  <span className={`font-bold ${newRemaining <= 0 ? 'text-green-700' : 'text-blue-900'}`}>
                    {newRemaining <= 0 ? 'Fully Paid!' : `฿${newRemaining.toLocaleString()}`}
                  </span>
                </div>
              </div>
            </div>
          )}

          <Button onClick={handleConfirmAmount} className="w-full" size="lg">
            Proceed to Payment
          </Button>
        </Card>
      )}

      {/* Step 2: QR Code */}
      {step === 2 && (
        <Card>
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2.5 bg-blue-100 rounded-lg">
              <QrCode className="w-6 h-6 text-blue-700" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">Scan QR Code to Pay</h2>
              <p className="text-gray-500 text-sm">Transfer exactly ฿{amount.toLocaleString()}</p>
            </div>
          </div>

          <div className="text-center mb-6">
            <div className="bg-gray-100 rounded-xl p-8 inline-block mb-4">
              <div className="w-48 h-48 bg-white rounded-lg flex items-center justify-center border-2 border-gray-300">
                <QrCode className="w-32 h-32 text-gray-400" />
              </div>
            </div>
            <p className="font-bold text-2xl text-gray-900">฿{amount.toLocaleString()}</p>
            <p className="text-gray-500 text-sm mt-1">Loan Repayment</p>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-yellow-700 space-y-1">
                <p>Transfer exactly <strong>฿{amount.toLocaleString()}</strong> — partial amounts cause verification delays.</p>
                <p>Screenshot the confirmation before closing this page.</p>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep(1)} className="flex-1">Back</Button>
            <Button onClick={() => { setError(null); setStep(3) }} className="flex-1">
              I&apos;ve Paid
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
              <h2 className="font-semibold text-gray-900">Upload Payment Evidence</h2>
              <p className="text-gray-500 text-sm">Submit your transfer screenshot</p>
            </div>
          </div>

          <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors mb-5">
            <Upload className="w-10 h-10 text-gray-400 mb-3" />
            {evidence ? (
              <div className="text-center">
                <p className="text-sm font-medium text-blue-700">{evidence.name}</p>
                <p className="text-xs text-gray-400 mt-1">Click to change</p>
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

          <div className="bg-gray-50 rounded-lg p-4 mb-5 text-sm">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-500">Payment amount</span>
              <span className="font-semibold text-gray-900">฿{amount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">New remaining balance</span>
              <span className="font-semibold text-gray-900">{newRemaining <= 0 ? 'Fully Paid' : `฿${newRemaining.toLocaleString()}`}</span>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep(2)} disabled={loading} className="flex-1">Back</Button>
            <Button onClick={handleSubmit} loading={loading} className="flex-1">
              Submit Repayment
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
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Repayment Submitted!</h2>
            <p className="text-gray-600 mb-2">
              Your repayment of <strong>฿{amount.toLocaleString()}</strong> has been received.
            </p>
            <p className="text-gray-500 text-sm mb-6">
              Admin will verify your payment within 24 hours and update your loan balance.
            </p>

            <div className="bg-green-50 rounded-xl p-4 mb-6 text-left">
              <p className="text-green-900 font-semibold text-sm mb-2">Repayment Summary</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-green-700">Amount Paid</span>
                  <span className="font-medium text-green-900">฿{amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-700">Status</span>
                  <span className="font-medium text-green-900">Pending Verification</span>
                </div>
                {newRemaining > 0 && (
                  <div className="flex justify-between">
                    <span className="text-green-700">New Remaining</span>
                    <span className="font-medium text-green-900">฿{newRemaining.toLocaleString()}</span>
                  </div>
                )}
              </div>
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
