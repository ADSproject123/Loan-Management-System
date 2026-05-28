'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Steps } from '@/components/ui/Steps'
import { requestCapitalWithdrawal } from '@/app/actions/member'
import {
  ArrowLeft,
  Wallet,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Calendar,
  Info,
  ArrowRight,
  PiggyBank,
  XCircle,
} from 'lucide-react'

const STEPS = [
  { id: 1, label: 'Amount', description: 'Enter amount' },
  { id: 2, label: 'Form', description: 'Fill details' },
  { id: 3, label: 'Review', description: 'Confirm' },
  { id: 4, label: 'Done', description: 'Submitted' },
]

// Mock member savings data
const memberSavings = {
  totalBalance: 45000,
  monthlyInterest: 1350,
}

// Current date for window check (Jan 20-25)
const today = new Date()
const isWithdrawalWindow = today.getMonth() === 0 && today.getDate() >= 20 && today.getDate() <= 25

export default function CapitalRequestPage() {
  const [step, setStep] = useState(1)
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')
  const [afterDecision, setAfterDecision] = useState<'continue' | 'withdraw' | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleStep1Next = () => {
    const amt = parseFloat(amount)
    if (!amount || isNaN(amt) || amt <= 0) {
      setError('Please enter a valid withdrawal amount.')
      return
    }
    if (amt > memberSavings.totalBalance) {
      setError(`Amount cannot exceed your savings balance of ฿${memberSavings.totalBalance.toLocaleString()}.`)
      return
    }
    setError(null)
    setStep(2)
  }

  const handleStep2Next = () => {
    if (!reason.trim()) {
      setError('Please provide a reason for your capital request.')
      return
    }
    if (!afterDecision) {
      setError('Please select what you would like to do after the withdrawal.')
      return
    }
    setError(null)
    setStep(3)
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError(null)

    const payload = new FormData()
    payload.append('amount', amount)
    payload.append('reason', reason)
    payload.append('after_decision', afterDecision ?? '')

    const result = await requestCapitalWithdrawal(payload)
    setLoading(false)

    if (!result.success) {
      setError(result.error ?? 'Unable to submit capital request.')
      return
    }

    setStep(4)
  }

  const withdrawAmount = parseFloat(amount) || 0

  return (
    <div className="p-6 md:p-8 max-w-2xl mx-auto">
      <div className="mb-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Capital Withdrawal Request</h1>
        <p className="text-gray-500 text-sm mt-1">Request withdrawal of your savings capital</p>
      </div>

      {/* Withdrawal Window Notice */}
      {!isWithdrawalWindow && step < 4 && (
        <div className="bg-yellow-50 border border-yellow-300 rounded-xl p-5 mb-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-yellow-900 font-semibold mb-1">Outside Withdrawal Window</p>
              <p className="text-yellow-700 text-sm">
                Capital withdrawal requests are only processed during <strong>January 20-25</strong> each year.
                You can still submit your request now, but it will be queued for the next withdrawal window.
              </p>
              <div className="flex items-center gap-2 mt-3 text-yellow-700 text-sm">
                <Calendar className="w-4 h-4" />
                <span>Next window: January 20-25, 2026</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {isWithdrawalWindow && step < 4 && (
        <div className="bg-green-50 border border-green-300 rounded-xl p-4 mb-6 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
          <div>
            <p className="text-green-900 font-semibold text-sm">Withdrawal Window is Open!</p>
            <p className="text-green-700 text-sm">You can submit your capital withdrawal request now (January 20-25).</p>
          </div>
        </div>
      )}

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

      {/* Current Balance Card */}
      {step < 4 && (
        <div className="bg-gradient-to-r from-blue-900 to-blue-700 text-white rounded-xl p-5 mb-6">
          <p className="text-blue-200 text-xs uppercase tracking-wider font-semibold mb-2">Your Savings Balance</p>
          <p className="text-3xl font-bold">฿{memberSavings.totalBalance.toLocaleString()}</p>
          <p className="text-blue-200 text-sm mt-1">Monthly interest: ฿{memberSavings.monthlyInterest.toLocaleString()}</p>
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
              <h2 className="font-semibold text-gray-900">Withdrawal Amount</h2>
              <p className="text-gray-500 text-sm">How much capital would you like to withdraw?</p>
            </div>
          </div>

          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Amount (฿)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">฿</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                min="100"
                max={memberSavings.totalBalance}
                className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg font-semibold text-gray-900"
              />
            </div>
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>Minimum: ฿100</span>
              <span>Maximum: ฿{memberSavings.totalBalance.toLocaleString()}</span>
            </div>
          </div>

          <div className="flex gap-2 mb-5">
            {[10000, 20000, 30000, memberSavings.totalBalance].map((amt, i) => (
              <button
                key={i}
                onClick={() => setAmount(amt.toString())}
                className={`flex-1 px-2 py-2 rounded-lg text-xs font-medium transition-colors border ${
                  parseFloat(amount) === amt
                    ? 'bg-blue-900 text-white border-blue-900'
                    : 'border-gray-300 text-gray-700 hover:border-blue-400 hover:text-blue-700'
                }`}
              >
                {i === 3 ? 'All' : ''}
                <br />
                ฿{amt.toLocaleString()}
              </button>
            ))}
          </div>

          {withdrawAmount > 0 && (
            <div className="bg-purple-50 rounded-lg p-4 mb-5">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-purple-700">Withdrawal amount</span>
                  <span className="font-semibold text-purple-900">฿{withdrawAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-purple-700">Remaining balance</span>
                  <span className="font-semibold text-purple-900">
                    ฿{(memberSavings.totalBalance - withdrawAmount).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="bg-blue-50 rounded-lg p-3 mb-5 flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="text-blue-700 text-xs">
              Withdrawal is subject to approval. Approved amounts are processed during January 20-25.
            </p>
          </div>

          <Button onClick={handleStep1Next} className="w-full" size="lg">Continue</Button>
        </Card>
      )}

      {/* Step 2: Fill Form */}
      {step === 2 && (
        <Card>
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2.5 bg-blue-100 rounded-lg">
              <Wallet className="w-6 h-6 text-blue-700" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">Withdrawal Details</h2>
              <p className="text-gray-500 text-sm">Provide additional details for your request</p>
            </div>
          </div>

          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Reason for Withdrawal</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Please describe why you are withdrawing your savings capital..."
              rows={4}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
            />
          </div>

          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              After withdrawal, I would like to:
            </label>
            <div className="space-y-3">
              <button
                onClick={() => setAfterDecision('continue')}
                className={`w-full flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-colors ${
                  afterDecision === 'continue'
                    ? 'border-blue-900 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                  afterDecision === 'continue' ? 'border-blue-900 bg-blue-900' : 'border-gray-300'
                }`}>
                  {afterDecision === 'continue' && <div className="w-2 h-2 bg-white rounded-full" />}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <PiggyBank className="w-4 h-4 text-green-600" />
                    <p className="font-medium text-gray-900">Continue Saving</p>
                  </div>
                  <p className="text-gray-500 text-sm">
                    Withdraw capital but remain an active SanSam member and continue monthly savings.
                  </p>
                </div>
              </button>

              <button
                onClick={() => setAfterDecision('withdraw')}
                className={`w-full flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-colors ${
                  afterDecision === 'withdraw'
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-200 hover:border-gray-300'
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
                    <p className="font-medium text-gray-900">Remove Membership</p>
                  </div>
                  <p className="text-gray-500 text-sm">
                    Withdraw capital and terminate my SanSam membership. All balances will be settled.
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
                  <strong>Warning:</strong> Removing membership is permanent. You will lose access to all
                  SanSam services including loans and savings programs. To rejoin, you must go through
                  the full registration process again.
                </p>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep(1)} className="flex-1">Back</Button>
            <Button onClick={handleStep2Next} className="flex-1">Continue</Button>
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
              <h2 className="font-semibold text-gray-900">Review Request</h2>
              <p className="text-gray-500 text-sm">Confirm your capital withdrawal request</p>
            </div>
          </div>

          <div className="space-y-3 mb-6">
            {[
              { label: 'Withdrawal Amount', value: `฿${withdrawAmount.toLocaleString()}` },
              { label: 'Current Balance', value: `฿${memberSavings.totalBalance.toLocaleString()}` },
              { label: 'Remaining After', value: `฿${(memberSavings.totalBalance - withdrawAmount).toLocaleString()}` },
              { label: 'Reason', value: reason },
              { label: 'After Withdrawal', value: afterDecision === 'continue' ? 'Continue Saving' : 'Remove Membership' },
            ].map((item) => (
              <div key={item.label} className="flex items-start justify-between py-2.5 border-b border-gray-100">
                <span className="text-gray-500 text-sm">{item.label}</span>
                <span className={`text-sm font-medium text-right max-w-xs ${
                  item.label === 'After Withdrawal' && afterDecision === 'withdraw' ? 'text-red-600' : 'text-gray-900'
                }`}>
                  {item.value}
                </span>
              </div>
            ))}
          </div>

          <div className="bg-blue-50 rounded-xl p-4 mb-5">
            <p className="text-blue-900 text-sm font-semibold mb-2">Processing Timeline</p>
            <div className="flex items-center gap-2 text-blue-700 text-sm">
              <Calendar className="w-4 h-4" />
              <p>
                Requests are reviewed and notifications sent during <strong>January 20-25</strong>.
                Approved amounts are transferred at that time.
              </p>
            </div>
          </div>

          {afterDecision === 'withdraw' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-5">
              <p className="text-red-800 text-sm font-medium mb-1">Confirm Membership Termination</p>
              <p className="text-red-700 text-sm">
                By submitting, you confirm you wish to permanently remove your SanSam membership
                after the capital is withdrawn. This action cannot be undone.
              </p>
            </div>
          )}

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep(2)} disabled={loading} className="flex-1">Back</Button>
            <Button
              onClick={handleSubmit}
              loading={loading}
              variant={afterDecision === 'withdraw' ? 'danger' : 'primary'}
              className="flex-1"
            >
              {afterDecision === 'withdraw' ? 'Submit & Remove Membership' : 'Submit Request'}
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
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Request Submitted!</h2>
            <p className="text-gray-600 mb-2">
              Your capital withdrawal request of <strong>฿{withdrawAmount.toLocaleString()}</strong> has been submitted.
            </p>
            <p className="text-gray-500 text-sm mb-6">
              You will receive a notification with the decision during{' '}
              <strong>January 20-25</strong>. Approved amounts will be transferred at that time.
            </p>

            <div className="bg-blue-50 rounded-xl p-5 mb-6 text-left">
              <p className="text-blue-900 font-semibold text-sm mb-3">Request Details</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-blue-700">Requested Amount</span>
                  <span className="font-medium text-blue-900">฿{withdrawAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700">After Withdrawal</span>
                  <span className={`font-medium ${afterDecision === 'withdraw' ? 'text-red-600' : 'text-blue-900'}`}>
                    {afterDecision === 'continue' ? 'Continue Saving' : 'Remove Membership'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700">Status</span>
                  <span className="font-medium text-blue-900">Pending Review</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3 justify-center">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 bg-blue-900 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-800 transition-colors"
              >
                Back to Dashboard <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
