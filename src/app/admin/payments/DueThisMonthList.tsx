'use client'

import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { CalendarClock } from 'lucide-react'
import { formatDate, money } from '@/app/admin/adminUtils'
import { LoanDueActions } from '@/app/admin/payments/LoanDueActions'
import { KHMER_MONTHS } from '@/lib/dates'
import type { LoanDueThisMonthRow } from '@/lib/admin/loanRepaymentDue'
import { LOAN_DUE_STATUS_LABELS, LOAN_DUE_STATUS_STYLES } from '@/lib/admin/repaymentStatus'
import type { CurrencyCode } from '@/lib/currency'
import {
  AdminTableEmpty,
  AdminTableNoResults,
  adminTable,
  adminTableRowClass,
} from '@/components/admin'

export function DueThisMonthList({
  rows,
  totalCount,
  month,
  year,
}: {
  rows: LoanDueThisMonthRow[]
  totalCount?: number
  month: number
  year: number
}) {
  const router = useRouter()
  const listTotal = totalCount ?? rows.length
  const monthLabel = KHMER_MONTHS[month - 1] ?? String(month)
  const emptyTitle = `មិនមានសមាជិកត្រូវបង់ក្នុងខែ ${monthLabel}`
  const emptyDescription = `សមាជិកដែលមានកម្ជីសកម្មនិងត្រូវបង់ក្នុងខែ ${monthLabel} ${year} នឹងបង្ហាញនៅទីនេះ។`

  const { totalDueAmount, totalInterest, currency } = useMemo(() => {
    let dueAmount = 0
    let interest = 0
    for (const row of rows) {
      dueAmount += row.dueAmount
      interest += row.dueInterest
    }
    return {
      totalDueAmount: dueAmount,
      totalInterest: interest,
      currency: (rows[0]?.currency as CurrencyCode) ?? 'USD',
    }
  }, [rows])

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className={adminTable.wrap}>
        <table className={`${adminTable.table} min-w-208`}>
          <thead className={adminTable.thead}>
            <tr className={adminTable.thRow}>
              <th className={adminTable.thFirst}>សមាជិក</th>
              <th className={adminTable.th}>ទូរស័ព្ទ</th>
              <th className={adminTable.th}>ខែ</th>
              <th className={adminTable.th}>ថ្ងៃត្រូវបង់</th>
              <th className={adminTable.th}>ចំនួនត្រូវបង់</th>
              <th className={adminTable.th}>ការប្រាក់</th>
              <th className={adminTable.th}>ស្ថានភាព</th>
              <th className={adminTable.thLast}>សកម្មភាព</th>
            </tr>
          </thead>
          <tbody className={adminTable.tbody}>
            {listTotal === 0 && (
              <AdminTableEmpty
                colSpan={8}
                icon={CalendarClock}
                title={emptyTitle}
                description={emptyDescription}
              />
            )}
            {listTotal > 0 && rows.length === 0 && <AdminTableNoResults colSpan={8} />}

            {rows.map((row) => (
              <tr
                key={row.loanId}
                className={adminTableRowClass({
                  clickable: true,
                })}
                onClick={() => router.push(`/admin/loans/${row.loanId}`)}
              >
                <td className={`${adminTable.tdFirst} ${adminTable.namePrimary}`}>{row.memberName}</td>
                <td className={adminTable.tdMuted}>{row.memberPhone ?? '—'}</td>
                <td className={adminTable.tdMuted}>ខែ {row.month}</td>
                <td className={adminTable.tdMuted}>{formatDate(row.dueDate)}</td>
                <td className={adminTable.td}>
                  <p className={adminTable.amountPrimary}>
                    {money(row.dueAmount, (row.currency as CurrencyCode) ?? 'USD')}
                  </p>
                </td>
                <td className={adminTable.td}>
                  <p className="font-semibold tabular-nums text-emerald-700">
                    {money(row.dueInterest, (row.currency as CurrencyCode) ?? 'USD')}
                  </p>
                </td>
                <td className={adminTable.td}>
                  <span className={`text-xs font-semibold ${LOAN_DUE_STATUS_STYLES[row.status]}`}>
                    {LOAN_DUE_STATUS_LABELS[row.status]}
                  </span>
                </td>
                <td className={adminTable.tdLast} onClick={(event) => event.stopPropagation()}>
                  {row.dueDate ? (
                    <LoanDueActions
                      loanId={row.loanId}
                      memberId={row.memberId}
                      periodYear={row.periodYear}
                      periodMonth={row.periodMonth}
                      scheduleMonth={row.month}
                      amount={row.dueAmount}
                      interestAmount={row.dueInterest}
                      currency={row.currency}
                      dueDate={row.dueDate}
                      status={row.status}
                    />
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
          {rows.length > 0 && (
            <tfoot className="border-t-2 border-border bg-surface-muted/60">
              <tr>
                <td className={`${adminTable.tdFirst} font-semibold text-foreground`} colSpan={4}>
                  សរុប ({rows.length} កម្ជី)
                </td>
                <td className={adminTable.td}>
                  <p className={`${adminTable.amountPrimary} font-bold`}>
                    {money(totalDueAmount, currency)}
                  </p>
                </td>
                <td className={adminTable.td}>
                  <p className={`${adminTable.amountPrimary} font-bold text-emerald-700`}>
                    {money(totalInterest, currency)}
                  </p>
                </td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  )
}
