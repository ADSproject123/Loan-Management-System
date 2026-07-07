import { formatMoney, type CurrencyCode } from '@/lib/currency'
import { dataTable } from '@/components/ui/tableStyles'
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
    <tfoot className={dataTable.tfoot}>
      <tr>
        <td colSpan={2} className={dataTable.td}>
          <p className="text-xs font-bold uppercase tracking-wide text-muted">សរុបទូទៅ</p>
          <p className="mt-1 text-sm font-bold text-foreground">
            {stats.paymentCount} <span className="font-semibold text-muted">ដង</span>
          </p>
        </td>
        <td colSpan={3} className={dataTable.td} />
        <td className={dataTable.td}>
          <p className="text-xs font-semibold text-muted">សរុបត្រូវបង់</p>
          <p className="mt-1 font-bold tabular-nums text-brand-950">
            {formatMoney(stats.totalDue, currency)}
          </p>
        </td>
        <td colSpan={statusColSpan} className={dataTable.td}>
          <div className="flex flex-col gap-1 text-xs">
            <p>
              <span className="font-semibold text-muted">បានបង់រួច </span>
              <span className="font-bold tabular-nums text-green-700">
                {formatMoney(stats.totalPaid, currency)}
              </span>
            </p>
            <p>
              <span className="font-semibold text-muted">នៅសល់ត្រូវបង់ </span>
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
