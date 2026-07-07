'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { formatMoney, type CurrencyCode } from '@/lib/currency'
import { formatKhmerDate } from '@/lib/dates'
import { dataTable, tableContainer, tableScroll } from '@/components/ui/tableStyles'
import type { LoanScheduleRow } from '@/lib/interestCalculations'
import { LoanScheduleTableFooter } from '@/components/loans/LoanScheduleOverallSummary'
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
  pending: 'text-foreground',
  overdue: 'text-red-700',
}

type LoanPaymentScheduleProps = {
  schedule: LoanScheduleRow[]
  currency?: CurrencyCode
  className?: string
  compact?: boolean
  repayHref?: string
  showRowPayButton?: boolean
  onPayMonth?: (month: number) => void
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
  onPayMonth,
  fileBaseName,
  memberName,
  showDownload = true,
}: LoanPaymentScheduleProps) {
  if (schedule.length === 0) return null

  return (
    <div className={className}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-base font-semibold text-gray-900">តារាបង់ប្រចាំខែ</h3>
        <div className="flex flex-wrap items-center gap-3">
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

      <div className={tableContainer}>
        <div className={tableScroll}>
        <table className={`${dataTable.table} min-w-160`}>
          <thead className={dataTable.thead}>
            <tr className={dataTable.thRow}>
              <th className={dataTable.th}>ខែ</th>
              <th className={dataTable.th}>កាលបរិច្ឆេទត្រូវបង់</th>
              <th className={dataTable.th}>ប្រាក់ដើម</th>
              <th className={dataTable.th}>ប្រាក់ដើមនៅសល់</th>
              <th className={dataTable.th}>ការប្រាក់</th>
              <th className={dataTable.th}>ចំនួនត្រូវបង់</th>
              <th className={dataTable.th}>ស្ថានភាព</th>
              {showRowPayButton ? <th className={dataTable.thRight}>សកម្មភាព</th> : null}
            </tr>
          </thead>
          <tbody className={dataTable.tbody}>
            {schedule.map((row) => (
              <tr key={row.month} className={dataTable.tr}>
                <td className={`${dataTable.td} font-medium`}>ខែ {row.month}</td>
                <td className={dataTable.tdMuted}>{formatKhmerDate(row.dueDate, '—')}</td>
                <td className={`${dataTable.td} tabular-nums`}>
                  {formatMoney(row.principalPortion, currency)}
                </td>
                <td className={`${dataTable.td} tabular-nums`}>
                  {formatMoney(row.remainingBalance, currency)}
                </td>
                <td className={`${dataTable.td} tabular-nums`}>
                  {formatMoney(row.interestPortion, currency)}
                </td>
                <td className={`${dataTable.td} font-semibold tabular-nums`}>
                  {formatMoney(row.amount, currency)}
                </td>
                <td className={dataTable.td}>
                  <span className={`text-xs font-semibold ${STATUS_CLASSES[row.status]}`}>
                    {STATUS_LABELS[row.status]}
                  </span>
                </td>
                {showRowPayButton ? (
                  <td className={dataTable.tdRight}>
                    {row.status === 'paid' ? (
                      <span className="text-xs text-foreground">—</span>
                    ) : row.pendingAmount > 0 ? (
                      <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">
                        រង់ចាំទទួល
                      </span>
                    ) : onPayMonth ? (
                      <button
                        type="button"
                        onClick={() => onPayMonth(row.month)}
                        className="inline-flex items-center gap-1 rounded-lg bg-brand-950 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-brand-900"
                      >
                        បង់ប្រាក់
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
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
          <LoanScheduleTableFooter
            schedule={schedule}
            currency={currency}
            showActionColumn={showRowPayButton}
          />
        </table>
        </div>
      </div>
    </div>
  )
}
