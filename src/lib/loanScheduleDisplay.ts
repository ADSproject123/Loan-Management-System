import { formatMoney, type CurrencyCode } from '@/lib/currency'
import type { LoanScheduleRow } from '@/lib/interestCalculations'

export const SCHEDULE_APP_NAME = 'សមាគមន៏សន្សំ'
export const SCHEDULE_APP_TAGLINE = 'ប្រព័ន្ធគ្រប់គ្រងសន្សំ និង កម្ជី'
export const SCHEDULE_APP_LOGO_PATH = '/loanManagementLogo.png'

export type ScheduleSummaryStats = {
  paymentCount: number
  totalDue: number
  totalPaid: number
  remaining: number
}

export function getScheduleSummaryStats(schedule: LoanScheduleRow[]): ScheduleSummaryStats {
  const totalDue = schedule.reduce((sum, row) => sum + row.amount, 0)
  const totalPaid = schedule.reduce((sum, row) => sum + row.paidAmount, 0)

  return {
    paymentCount: schedule.length,
    totalDue,
    totalPaid,
    remaining: Math.max(0, totalDue - totalPaid),
  }
}

export function formatScheduleSummary(
  schedule: LoanScheduleRow[],
  currency: CurrencyCode = 'USD',
) {
  const stats = getScheduleSummaryStats(schedule)
  return `ការបង់ ${stats.paymentCount} ដង | សរុប ${formatMoney(stats.totalDue, currency)} | បានបង់ ${formatMoney(stats.totalPaid, currency)}`
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function buildScheduleTableFooterHtml(
  schedule: LoanScheduleRow[],
  currency: CurrencyCode = 'USD',
) {
  const stats = getScheduleSummaryStats(schedule)

  return `
    <tfoot>
      <tr style="background:#f9fafb;border-top:2px solid #e5e7eb">
        <td colspan="2" style="padding:12px 16px">
          <p style="margin:0;font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.04em">សរុបទូទៅ</p>
          <p style="margin:4px 0 0;font-size:14px;font-weight:700;color:#111827">${stats.paymentCount} <span style="font-weight:600;color:#6b7280">ដង</span></p>
        </td>
        <td colspan="3" style="padding:12px 16px"></td>
        <td style="padding:12px 16px">
          <p style="margin:0;font-size:11px;font-weight:600;color:#6b7280">សរុបត្រូវបង់</p>
          <p style="margin:4px 0 0;font-size:14px;font-weight:700;color:#172554;font-variant-numeric:tabular-nums">${escapeHtml(formatMoney(stats.totalDue, currency))}</p>
        </td>
        <td style="padding:12px 16px">
          <p style="margin:0 0 4px;font-size:12px">
            <span style="font-weight:600;color:#6b7280">បានបង់រួច </span>
            <span style="font-weight:700;color:#15803d;font-variant-numeric:tabular-nums">${escapeHtml(formatMoney(stats.totalPaid, currency))}</span>
          </p>
          <p style="margin:0;font-size:12px">
            <span style="font-weight:600;color:#6b7280">នៅសល់ត្រូវបង់ </span>
            <span style="font-weight:700;color:#b45309;font-variant-numeric:tabular-nums">${escapeHtml(formatMoney(stats.remaining, currency))}</span>
          </p>
        </td>
      </tr>
    </tfoot>
  `
}
