import { formatKhmerDate } from '@/lib/dates'
import { formatMoney, type CurrencyCode } from '@/lib/currency'
import type { LoanScheduleRow } from '@/lib/interestCalculations'

const STATUS_LABELS: Record<LoanScheduleRow['status'], string> = {
  paid: 'បានបង់',
  partial: 'បង់មិនគ្រប់',
  pending: 'រង់ចាំ',
  overdue: 'ហួសកំណត់',
}

export type LoanScheduleExportOptions = {
  schedule: LoanScheduleRow[]
  currency?: CurrencyCode
  fileBaseName?: string
  compact?: boolean
  memberName?: string
}

function sanitizeFileName(value: string) {
  return value.replace(/[^\w\u1780-\u17FF-]+/g, '_').replace(/_+/g, '_').slice(0, 80)
}

function defaultFileBaseName(options: LoanScheduleExportOptions) {
  if (options.fileBaseName) return sanitizeFileName(options.fileBaseName)
  if (options.memberName) return sanitizeFileName(`loan-schedule-${options.memberName}`)
  return 'loan-payment-schedule'
}

function scheduleRowsForExport(options: LoanScheduleExportOptions) {
  return options.schedule.map((row) => ({
    ខែ: row.month,
    កាលបរិច្ឆេទត្រូវបង់: formatKhmerDate(row.dueDate, '—'),
    ប្រាក់ដើម: row.principalPortion,
    ការប្រាក់: row.interestPortion,
    ចំនួនត្រូវបង់: row.amount,
    បានបង់: row.paidAmount,
    ស្ថានភាព: STATUS_LABELS[row.status],
  }))
}

function triggerBlobDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

export async function downloadLoanScheduleExcel(options: LoanScheduleExportOptions) {
  const XLSX = await import('xlsx')
  const rows = scheduleRowsForExport(options)
  const currency = options.currency ?? 'USD'
  const totalDue = options.schedule.reduce((sum, row) => sum + row.amount, 0)
  const totalPaid = options.schedule.reduce((sum, row) => sum + row.paidAmount, 0)

  const sheet = XLSX.utils.json_to_sheet(rows)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, sheet, 'តារាបង់')

  const summary = XLSX.utils.aoa_to_sheet([
    ['តារាបង់ប្រចាំខែ'],
    ['ចំនួនខែ', options.schedule.length],
    ['សរុបត្រូវបង់', formatMoney(totalDue, currency)],
    ['បានបង់', formatMoney(totalPaid, currency)],
  ])
  XLSX.utils.book_append_sheet(workbook, summary, 'សង្ខេប')

  const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  triggerBlobDownload(blob, `${defaultFileBaseName(options)}.xlsx`)
}

export async function downloadLoanSchedulePdf(options: LoanScheduleExportOptions) {
  const { jsPDF } = await import('jspdf')
  const autoTable = (await import('jspdf-autotable')).default

  const currency = options.currency ?? 'USD'
  const totalDue = options.schedule.reduce((sum, row) => sum + row.amount, 0)
  const totalPaid = options.schedule.reduce((sum, row) => sum + row.paidAmount, 0)
  const fileName = defaultFileBaseName(options)

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  doc.setFontSize(14)
  doc.text('Loan Payment Schedule', 14, 16)
  doc.setFontSize(10)
  doc.text(`Payments: ${options.schedule.length}`, 14, 23)
  doc.text(`Total due: ${formatMoney(totalDue, currency)}`, 14, 29)
  doc.text(`Total paid: ${formatMoney(totalPaid, currency)}`, 14, 35)

  const head = ['Month', 'Due date', 'Principal', 'Interest', 'Amount', 'Paid', 'Status']

  const body = options.schedule.map((row) => [
    String(row.month),
    row.dueDate ?? '—',
    formatMoney(row.principalPortion, currency),
    formatMoney(row.interestPortion, currency),
    formatMoney(row.amount, currency),
    formatMoney(row.paidAmount, currency),
    STATUS_LABELS[row.status],
  ])

  autoTable(doc, {
    startY: 42,
    head: [head],
    body,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [30, 58, 138] },
    columnStyles: {
      0: { cellWidth: 12 },
      1: { cellWidth: 22 },
    },
  })

  doc.save(`${fileName}.pdf`)
}
