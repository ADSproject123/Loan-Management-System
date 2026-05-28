'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ArrowLeft, FileText, CheckCircle, AlertCircle, Send, Calendar } from 'lucide-react'

export default function SavingReportPage() {
  const [periodFrom, setPeriodFrom] = useState('')
  const [periodTo, setPeriodTo] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    if (!periodFrom || !periodTo) {
      setError('Please select both start and end dates.')
      return
    }
    if (new Date(periodFrom) > new Date(periodTo)) {
      setError('Start date must be before end date.')
      return
    }
    setError(null)
    setLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setLoading(false)
    setSubmitted(true)
  }

  const quickPeriods = [
    { label: 'Last Month', from: '2025-04-01', to: '2025-04-30' },
    { label: 'Last 3 Months', from: '2025-02-01', to: '2025-04-30' },
    { label: 'This Year', from: '2025-01-01', to: '2025-12-31' },
    { label: 'Last Year', from: '2024-01-01', to: '2024-12-31' },
  ]

  return (
    <div className="p-6 md:p-8 max-w-xl mx-auto">
      <div className="mb-6">
        <Link
          href="/dashboard/savings"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Savings
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Request Saving Report</h1>
        <p className="text-gray-500 text-sm mt-1">
          Get a detailed report of your savings sent to your Telegram account
        </p>
      </div>

      {!submitted ? (
        <Card>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-blue-100 rounded-lg">
              <FileText className="w-6 h-6 text-blue-700" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">Select Report Period</h2>
              <p className="text-gray-500 text-sm">Choose the date range for your report</p>
            </div>
          </div>

          {error && (
            <div className="mb-5 flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* Quick periods */}
          <div className="mb-5">
            <p className="text-sm text-gray-500 mb-2">Quick select:</p>
            <div className="grid grid-cols-2 gap-2">
              {quickPeriods.map((period) => (
                <button
                  key={period.label}
                  onClick={() => {
                    setPeriodFrom(period.from)
                    setPeriodTo(period.to)
                  }}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors border text-left ${
                    periodFrom === period.from && periodTo === period.to
                      ? 'bg-blue-900 text-white border-blue-900'
                      : 'border-gray-300 text-gray-700 hover:border-blue-400 hover:text-blue-700 hover:bg-blue-50'
                  }`}
                >
                  {period.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 mb-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                <Calendar className="w-4 h-4 inline mr-1" />
                From Date
              </label>
              <input
                type="date"
                value={periodFrom}
                onChange={(e) => setPeriodFrom(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                <Calendar className="w-4 h-4 inline mr-1" />
                To Date
              </label>
              <input
                type="date"
                value={periodTo}
                onChange={(e) => setPeriodTo(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-900"
              />
            </div>
          </div>

          {periodFrom && periodTo && (
            <div className="bg-blue-50 rounded-lg p-4 mb-5">
              <p className="text-blue-900 text-sm font-medium mb-1">Report will include:</p>
              <ul className="text-blue-700 text-sm space-y-1">
                <li>• All saving contributions from {new Date(periodFrom).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}</li>
                <li>• To {new Date(periodTo).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}</li>
                <li>• Total amount saved, interest earned, and running balance</li>
                <li>• Report sent to your registered Telegram account</li>
              </ul>
            </div>
          )}

          <div className="bg-gray-50 rounded-lg p-4 mb-5 flex items-start gap-2">
            <Send className="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5" />
            <p className="text-gray-600 text-sm">
              Reports are sent instantly to your Telegram account. Make sure you have linked your
              Telegram to your SanSam account.
            </p>
          </div>

          <Button onClick={handleSubmit} loading={loading} className="w-full" size="lg">
            <Send className="w-4 h-4" />
            Request Report
          </Button>
        </Card>
      ) : (
        <Card>
          <div className="text-center py-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Report Sent!</h2>
            <p className="text-gray-600 mb-2">
              Your saving report has been generated and sent to your Telegram account.
            </p>
            <p className="text-gray-500 text-sm mb-6">
              Period:{' '}
              <strong>
                {new Date(periodFrom).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                {' - '}
                {new Date(periodTo).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
              </strong>
            </p>

            <div className="flex gap-3 justify-center">
              <button
                onClick={() => { setSubmitted(false); setPeriodFrom(''); setPeriodTo('') }}
                className="inline-flex items-center gap-2 border border-gray-300 text-gray-700 px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors"
              >
                Request Another
              </button>
              <Link
                href="/dashboard/savings"
                className="inline-flex items-center gap-2 bg-blue-900 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-800 transition-colors"
              >
                Back to Savings
              </Link>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
