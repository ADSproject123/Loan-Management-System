import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { formatMoney, type CurrencyCode } from '@/lib/currency'
import { formatKhmerDate } from '@/lib/dates'
import type { LoanScheduleRow } from '@/lib/interestCalculations'
import { LoanPaymentScheduleDownloads } from '@/components/loans/LoanPaymentScheduleDownloads'

const STATUS_LABELS: Record<LoanScheduleRow['status'], string> = {
  paid: 'បានបង់',
  partial: 'បង់មិនគ្រប់',
  pending: 'រង់ចាំ',
  overdue: 'ហួសកំណត់',
}

const STATUS_CLASSES: Record<LoanScheduleRow['status'], string> = {
  paid: 'text-green-700',
  partial: 'text-amber-700',
  pending: 'text-gray-500',
  overdue: 'text-red-700',
}

type LoanPaymentScheduleProps = {
  schedule: LoanScheduleRow[]
  currency?: CurrencyCode
  className?: string
  compact?: boolean
  repayHref?: string
  showRowPayButton?: boolean
  fileBaseName?: string
  memberName?: string
  showDownload?: boolean
}

export function LoanPaymentSchedule({
  schedule,
  currency = 'USD',
  className = '',

  repayHref,
  showRowPayButton = false,
  fileBaseName,
  memberName,
  showDownload = true,
}: LoanPaymentScheduleProps) {
  if (schedule.length === 0) return null

  const totalDue = schedule.reduce((sum, row) => sum + row.amount, 0)
  const totalPaid = schedule.reduce((sum, row) => sum + row.paidAmount, 0)

  return (
    <div className={className}>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-gray-900">តារាបង់ប្រចាំខែ</h3>
          <p className="mt-1 text-sm text-gray-500">
            ការបង់ {schedule.length} ដង — សរុប {formatMoney(totalDue, currency)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-sm text-gray-600">
            បានបង់{' '}
            <span className="font-semibold text-gray-900">{formatMoney(totalPaid, currency)}</span>
          </p>
          {showDownload ? (
            <LoanPaymentScheduleDownloads
              schedule={schedule}
              currency={currency}

              fileBaseName={fileBaseName}
              memberName={memberName}
            />
          ) : null}
          {repayHref ? (
            <Link
              href={repayHref}
              className="inline-flex items-center gap-1.5 rounded-lg bg-brand-950 px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-900"
            >
              សងកម្ជី
              <ArrowRight className="h-4 w-4" />
            </Link>
          ) : null}
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="w-full min-w-160 text-left text-sm">
          <thead className="border-b border-gray-100 bg-gray-50/80">
            <tr className="text-sm font-bold uppercase tracking-wide text-gray-900">
              <th className="px-4 py-3 md:px-5">ខែ</th>
              <th className="px-4 py-3">កាលបរិច្ឆេទត្រូវបង់</th>
              <th className="px-4 py-3">ប្រាក់ដើម</th>
              <th className="px-4 py-3">ប្រាក់ដើមនៅសល់</th>
              <th className="px-4 py-3">ការប្រាក់</th>
              <th className="px-4 py-3">ចំនួនត្រូវបង់</th>
              <th className="px-4 py-3 md:px-5">ស្ថានភាព</th>
              {showRowPayButton ? <th className="px-4 py-3 md:px-5">សកម្មភាព</th> : null}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {schedule.map((row) => (
              <tr key={row.month} className="bg-white">
                <td className="px-4 py-3 font-medium text-gray-900 md:px-5">ខែ {row.month}</td>
                <td className="px-4 py-3 text-gray-600">{formatKhmerDate(row.dueDate, '—')}</td>
                <td className="px-4 py-3 tabular-nums text-gray-700">
                  {formatMoney(row.principalPortion, currency)}
                </td>
                <td className="px-4 py-3 tabular-nums text-gray-700">
                  {formatMoney(row.remainingBalance, currency)}
                </td>
                <td className="px-4 py-3 tabular-nums text-gray-700">
                  {formatMoney(row.interestPortion, currency)}
                </td>
                <td className="px-4 py-3 font-semibold tabular-nums text-gray-900">
                  {formatMoney(row.amount, currency)}
                </td>
                <td className="px-4 py-3 md:px-5">
                  <span
                    className={`text-xs font-semibold ${STATUS_CLASSES[row.status]}`}
                  >
                    {STATUS_LABELS[row.status]}
                  </span>
                </td>
                {showRowPayButton ? (
                  <td className="px-4 py-3 md:px-5">
                    {row.status === 'paid' ? (
                      <span className="text-xs text-gray-400">—</span>
                    ) : row.pendingAmount > 0 ? (
                      <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">
                        រង់ចាំទទួល
                      </span>
                    ) : (
                      <Link
                        href={`/dashboard/loans/repay/${row.month}`}
                        className="inline-flex items-center gap-1 rounded-lg bg-brand-950 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-brand-900"
                      >
                        បង់ប្រាក់
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    )}
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
