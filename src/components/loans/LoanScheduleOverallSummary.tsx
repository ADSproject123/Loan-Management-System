import { formatMoney, type CurrencyCode } from '@/lib/currency'
import type { LoanScheduleRow } from '@/lib/interestCalculations'
import { getScheduleSummaryStats } from '@/lib/loanScheduleDisplay'

type LoanScheduleTableFooterProps = {
  schedule: LoanScheduleRow[]
  currency?: CurrencyCode
  showActionColumn?: boolean
}

export function LoanScheduleTableFooter({
  schedule,
  currency = 'USD',
  showActionColumn = false,
}: LoanScheduleTableFooterProps) {
  const stats = getScheduleSummaryStats(schedule)
  const statusColSpan = showActionColumn ? 2 : 1

  return (
    <tfoot className="border-t-2 border-gray-200 bg-gray-50/90">
      <tr>
        <td colSpan={2} className="px-4 py-3 md:px-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">សរុបទូទៅ</p>
          <p className="mt-1 text-sm font-bold text-gray-900">
            {stats.paymentCount} <span className="font-semibold text-gray-500">ដង</span>
          </p>
        </td>
        <td colSpan={3} className="px-4 py-3" />
        <td className="px-4 py-3">
          <p className="text-xs font-semibold text-gray-500">សរុបត្រូវបង់</p>
          <p className="mt-1 font-bold tabular-nums text-brand-950">
            {formatMoney(stats.totalDue, currency)}
          </p>
        </td>
        <td colSpan={statusColSpan} className="px-4 py-3 md:px-5">
          <div className="flex flex-col gap-1 text-xs">
            <p>
              <span className="font-semibold text-gray-500">បានបង់រួច </span>
              <span className="font-bold tabular-nums text-green-700">
                {formatMoney(stats.totalPaid, currency)}
              </span>
            </p>
            <p>
              <span className="font-semibold text-gray-500">នៅសល់ត្រូវបង់ </span>
              <span className="font-bold tabular-nums text-amber-700">
                {formatMoney(stats.remaining, currency)}
              </span>
            </p>
          </div>
        </td>
      </tr>
    </tfoot>
  )
}
