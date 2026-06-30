'use client'

import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Coins } from 'lucide-react'
import { formatDate, money } from '@/app/admin/adminUtils'
import { SavingInterestActions } from '@/app/admin/savings/SavingInterestActions'
import { KHMER_MONTHS } from '@/lib/dates'
import type { SavingInterestDueRow } from '@/lib/admin/savingInterestDue'
import type { CurrencyCode } from '@/lib/currency'
import type { SavingInterestPaymentStatus } from '@/types/database'
import {
  AdminTableEmpty,
  AdminTableNoResults,
  adminTable,
  adminTableRowClass,
} from '@/components/admin'

const STATUS_LABELS: Record<SavingInterestPaymentStatus, string> = {
  pending: 'មិនទាន់បង់',
  completed: 'បានបង់',
  rejected: 'បដិសេធ',
}

const STATUS_STYLES: Record<SavingInterestPaymentStatus, string> = {
  pending: 'text-muted',
  completed: 'font-bold text-green-700',
  rejected: 'text-red-700',
}

function savingInterestStatusDisplay(row: SavingInterestDueRow) {
  if (row.isOverdue) {
    return { label: 'ហួសកំណត់', className: 'font-bold text-red-700' }
  }

  return {
    label: STATUS_LABELS[row.status],
    className: STATUS_STYLES[row.status],
  }
}

export function SavingInterestDueList({
  rows,
  totalCount,
  month,
  year,
}: {
  rows: SavingInterestDueRow[]
  totalCount?: number
  month: number
  year: number
}) {
  const router = useRouter()
  const listTotal = totalCount ?? rows.length
  const monthLabel = KHMER_MONTHS[month - 1] ?? String(month)
  const emptyTitle = `មិនមានសមាជិកត្រូវបង់ការប្រាក់ក្នុងខែ ${monthLabel}`
  const emptyDescription = `សមាជិកដែលមានសន្សំផ្ទៀងផ្ទាត់និងត្រូវទទួលការប្រាក់ក្នុងខែ ${monthLabel} ${year} នឹងបង្ហាញនៅទីនេះ។`

  const { totalInterest, currency } = useMemo(() => {
    let interest = 0
    for (const row of rows) {
      interest += row.interestDue
    }
    return {
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
              <th className={adminTable.th}>សមតុល្យសន្សំ</th>
              <th className={adminTable.th}>ការប្រាក់ត្រូវបង់</th>
              <th className={adminTable.th}>ថ្ងៃទទួល</th>
              <th className={adminTable.th}>ស្ថានភាព</th>
              <th className={adminTable.thLast}>សកម្មភាព</th>
            </tr>
          </thead>
          <tbody className={adminTable.tbody}>
            {listTotal === 0 && (
              <AdminTableEmpty
                colSpan={7}
                icon={Coins}
                title={emptyTitle}
                description={emptyDescription}
              />
            )}
            {listTotal > 0 && rows.length === 0 && <AdminTableNoResults colSpan={7} />}

            {rows.map((row) => {
              const statusDisplay = savingInterestStatusDisplay(row)

              return (
              <tr
                key={row.memberId}
                className={adminTableRowClass({
                  clickable: true,
                  overdue: row.isOverdue,
                })}
                onClick={() => router.push(`/admin/members/${row.memberId}`)}
              >
                <td className={`${adminTable.tdFirst} ${adminTable.namePrimary}`}>{row.memberName}</td>
                <td className={adminTable.tdMuted}>{row.memberPhone ?? '—'}</td>
                <td className={adminTable.td}>
                  <p className={adminTable.amountPrimary}>
                    {money(row.savingsBalance, (row.currency as CurrencyCode) ?? 'USD')}
                  </p>
                </td>
                <td className={adminTable.td}>
                  <p className={adminTable.amountPrimary}>
                    {money(row.interestDue, (row.currency as CurrencyCode) ?? 'USD')}
                  </p>
                </td>
                <td className={adminTable.tdMuted}>{formatDate(row.interestDate)}</td>
                <td className={adminTable.td}>
                  <span className={`text-xs font-semibold ${statusDisplay.className}`}>
                    {statusDisplay.label}
                  </span>
                </td>
                <td className={adminTable.tdLast} onClick={(event) => event.stopPropagation()}>
                  <SavingInterestActions
                    memberId={row.memberId}
                    periodYear={row.periodYear}
                    periodMonth={row.periodMonth}
                    amount={row.interestDue}
                    currency={row.currency}
                    interestDate={row.interestDate}
                    status={row.status}
                  />
                </td>
              </tr>
            )})}
          </tbody>
          {rows.length > 0 && (
            <tfoot className="border-t-2 border-border bg-surface-muted/60">
              <tr>
                <td className={`${adminTable.tdFirst} font-semibold text-foreground`} colSpan={3}>
                  សរុប ({rows.length} សមាជិក)
                </td>
                <td className={adminTable.td}>
                  <p className={`${adminTable.amountPrimary} font-bold text-emerald-700`}>
                    {money(totalInterest, currency)}
                  </p>
                </td>
                <td colSpan={3} />
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  )
}
