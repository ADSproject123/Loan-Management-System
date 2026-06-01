'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { requestReport } from '@/app/actions/member'
import { ArrowLeft, FileText, CheckCircle, AlertCircle, Send, Calendar } from 'lucide-react'

export default function LoanReportPage() {
  const [periodFrom, setPeriodFrom] = useState('')
  const [periodTo, setPeriodTo] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async () => {
    if (!periodFrom || !periodTo) {
      setError('សូមជ្រើសរើសកាលបរិច្ឆេទចាប់ផ្តើម និង បញ្ចប់។')
      return
    }
    if (new Date(periodFrom) > new Date(periodTo)) {
      setError('កាលបរិច្ឆេទចាប់ផ្តើមត្រូវនៅមុនកាលបរិច្ឆេទបញ្ចប់។')
      return
    }
    setError(null)
    setLoading(true)

    const payload = new FormData()
    payload.append('report_type', 'loan')
    payload.append('period_from', periodFrom)
    payload.append('period_to', periodTo)

    const result = await requestReport(payload)
    setLoading(false)

    if (!result.success) {
      setError(result.error ?? 'មិនអាចស្នើសុំរបាយការណ៍បានទេ។')
      return
    }

    setSubmitted(true)
  }

  const quickPeriods = [
    { label: 'ខែមុន', from: '2025-04-01', to: '2025-04-30' },
    { label: '៣ ខែចុងក្រោយ', from: '2025-02-01', to: '2025-04-30' },
    { label: 'ឆ្នាំនេះ', from: '2025-01-01', to: '2025-12-31' },
    { label: 'គ្រប់ពេលវេលា', from: '2024-01-01', to: '2025-12-31' },
  ]

  return (
    <div className="p-6 md:p-8 max-w-xl mx-auto">
      <div className="mb-6">
        <Link
          href="/dashboard/loans"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          ត្រឡប់ទៅឥណទាន
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">ស្នើសុំរបាយការណ៍ឥណទាន</h1>
        <p className="text-gray-500 text-sm mt-1">
          ទទួលរបាយការណ៍លម្អិតនៃឥណទាន និង ការសងរបស់អ្នកតាមរយៈ Telegram
        </p>
      </div>

      {!submitted ? (
        <Card>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-blue-100 rounded-lg">
              <FileText className="w-6 h-6 text-blue-700" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">ជ្រើសរើសរយៈពេលរបាយការណ៍</h2>
              <p className="text-gray-500 text-sm">ជ្រើសរើសរយៈពេលកាលបរិច្ឆេទសម្រាប់របាយការណ៍ឥណទាន</p>
            </div>
          </div>

          {error && (
            <div className="mb-5 flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 rounded-lg p-4">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          <div className="mb-5">
            <p className="text-sm text-gray-500 mb-2">ជ្រើសរើសរហ័ស៖</p>
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
                      : 'bg-white border-gray-300 text-gray-700 hover:border-blue-400 hover:text-blue-700 hover:bg-blue-50'
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
                ពីកាលបរិច្ឆេទ
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
                ដល់កាលបរិច្ឆេទ
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
              <p className="text-blue-900 text-sm font-medium mb-2">របាយការណ៍នឹងរួមមាន៖</p>
              <ul className="text-blue-700 text-sm space-y-1">
                <li>• ឥណទានទាំងអស់ដែលបានបើកក្នុងរយៈពេលដែលបានជ្រើស</li>
                <li>• ការសងទាំងអស់ដែលបានធ្វើក្នុងអំឡុងពេល</li>
                <li>• សមតុល្យដែលនៅសល់ និង ការប្រាក់ដែលបានកើនឡើង</li>
                <li>• ស្ថានភាពឥណទានសម្រាប់ឥណទានសកម្មនីមួយៗ</li>
              </ul>
            </div>
          )}

          <div className="bg-gray-50 rounded-lg p-4 mb-5 flex items-start gap-2">
            <Send className="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5" />
            <p className="text-gray-600 text-sm">
              របាយការណ៍ឥណទាននឹងត្រូវផ្ញើភ្លាមៗទៅគណនី Telegram ដែលបានភ្ជាប់របស់អ្នក។
            </p>
          </div>

          <Button onClick={handleSubmit} loading={loading} className="w-full" size="lg">
            <Send className="w-4 h-4" />
            ស្នើសុំរបាយការណ៍
          </Button>
        </Card>
      ) : (
        <Card>
          <div className="text-center py-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">របាយការណ៍បានផ្ញើ!</h2>
            <p className="text-gray-600 mb-2">
              របាយការណ៍ឥណទានរបស់អ្នកត្រូវបានផ្ញើទៅគណនី Telegram របស់អ្នក។
            </p>
            <p className="text-gray-500 text-sm mb-6">
              រយៈពេល៖{' '}
              <strong>
                {new Date(periodFrom).toLocaleDateString('km-KH', { day: 'numeric', month: 'short', year: 'numeric' })}
                {' - '}
                {new Date(periodTo).toLocaleDateString('km-KH', { day: 'numeric', month: 'short', year: 'numeric' })}
              </strong>
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => { setSubmitted(false); setPeriodFrom(''); setPeriodTo('') }}
                className="inline-flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors"
              >
                ស្នើសុំម្តងទៀត
              </button>
              <Link
                href="/dashboard/loans"
                className="inline-flex items-center gap-2 bg-blue-900 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-800 transition-colors"
              >
                ត្រឡប់ទៅឥណទាន
              </Link>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
