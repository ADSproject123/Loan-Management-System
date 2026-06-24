import ExcelJS from 'exceljs'
import { formatKhmerDate } from '@/lib/dates'
import { formatMoney, type CurrencyCode } from '@/lib/currency'
import type { LoanScheduleRow } from '@/lib/interestCalculations'
import {
  buildScheduleTableFooterHtml,
  formatScheduleSummary,
  SCHEDULE_APP_LOGO_PATH,
  SCHEDULE_APP_NAME,
  SCHEDULE_APP_TAGLINE,
} from '@/lib/loanScheduleDisplay'

const STATUS_LABELS: Record<LoanScheduleRow['status'], string> = {
  paid: 'បានបង់',
  partial: 'បង់មិនគ្រប់',
  pending: 'រង់ចាំ',
  overdue: 'ហួសកំណត់',
}

const STATUS_COLORS: Record<LoanScheduleRow['status'], { bg: string; text: string }> = {
  paid: { bg: 'FFDCFCE7', text: 'FF166534' },
  partial: { bg: 'FFFEF3C7', text: 'FF92400E' },
  pending: { bg: 'FFF3F4F6', text: 'FF374151' },
  overdue: { bg: 'FFFEE2E2', text: 'FF991B1B' },
}

const BRAND_BLUE = 'FF1E3A8A'
const BORDER_COLOR = 'FFE5E7EB'

export type LoanScheduleExportOptions = {
  schedule: LoanScheduleRow[]
  currency?: CurrencyCode
  fileBaseName?: string
  compact?: boolean
  memberName?: string
}

const HEADERS = [
  'ខែ',
  'កាលបរិច្ឆេទត្រូវបង់',
  'ប្រាក់ដើម',
  'ប្រាក់ដើមនៅសល់',
  'ការប្រាក់',
  'ចំនួនត្រូវបង់',
  'បានបង់',
  'ស្ថានភាព',
] as const

const COLUMN_WIDTHS = [8, 24, 14, 14, 14, 16, 14, 18]

const PDF_WIDTH_PX = 794

const WEB_TABLE_HEADERS = [
  'ខែ',
  'កាលបរិច្ឆេទត្រូវបង់',
  'ប្រាក់ដើម',
  'ប្រាក់ដើមនៅសល់',
  'ការប្រាក់',
  'ចំនួនត្រូវបង់',
  'ស្ថានភាព',
] as const

const WEB_STATUS_COLORS: Record<LoanScheduleRow['status'], string> = {
  paid: '#15803d',
  partial: '#b45309',
  pending: '#6b7280',
  overdue: '#b91c1c',
}

function sanitizeFileName(value: string) {
  return value.replace(/[^\w\u1780-\u17FF-]+/g, '_').replace(/_+/g, '_').slice(0, 80)
}

function defaultFileBaseName(options: LoanScheduleExportOptions) {
  if (options.fileBaseName) return sanitizeFileName(options.fileBaseName)
  if (options.memberName) return sanitizeFileName(`loan-schedule-${options.memberName}`)
  return 'loan-payment-schedule'
}

function triggerBlobDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function buildScheduleHtml(options: LoanScheduleExportOptions) {
  const currency = options.currency ?? 'USD'
  const fontBase = typeof window !== 'undefined' ? window.location.origin : ''
  const footerHtml = buildScheduleTableFooterHtml(options.schedule, currency)

  const tableRows = options.schedule
    .map((row) => {
      const statusColor = WEB_STATUS_COLORS[row.status]

      return `<tr style="background:#ffffff">
        <td style="font-weight:500;color:#111827">ខែ ${row.month}</td>
        <td style="color:#4b5563">${escapeHtml(formatKhmerDate(row.dueDate, '—'))}</td>
        <td style="font-variant-numeric:tabular-nums;color:#374151">${escapeHtml(formatMoney(row.principalPortion, currency))}</td>
        <td style="font-variant-numeric:tabular-nums;color:#374151">${escapeHtml(formatMoney(row.remainingBalance, currency))}</td>
        <td style="font-variant-numeric:tabular-nums;color:#374151">${escapeHtml(formatMoney(row.interestPortion, currency))}</td>
        <td style="font-variant-numeric:tabular-nums;font-weight:600;color:#111827">${escapeHtml(formatMoney(row.amount, currency))}</td>
        <td>
          <span style="font-size:12px;font-weight:600;color:${statusColor}">${STATUS_LABELS[row.status]}</span>
        </td>
      </tr>`
    })
    .join('')

  const memberLine = options.memberName
    ? `<p style="margin:0 0 12px;font-size:13px;color:#4b5563">សមាជិក: ${escapeHtml(options.memberName)}</p>`
    : ''

  return `
    <style>
      @font-face {
        font-family: 'Noto Sans Khmer';
        src: url('${fontBase}/fonts/NotoSansKhmer-Regular.ttf') format('truetype');
        font-weight: 400;
        font-style: normal;
      }
      @font-face {
        font-family: 'Noto Sans Khmer';
        src: url('${fontBase}/fonts/NotoSansKhmer-Bold.ttf') format('truetype');
        font-weight: 700;
        font-style: normal;
      }
      .schedule-pdf-root {
        font-family: 'Noto Sans Khmer', sans-serif;
        color: #111827;
        background: #ffffff;
        -webkit-font-smoothing: antialiased;
      }
      .schedule-pdf-root table {
        width: 100%;
        border-collapse: collapse;
        font-size: 14px;
        line-height: 1.45;
      }
      .schedule-pdf-root th,
      .schedule-pdf-root td {
        border-bottom: 1px solid #f3f4f6;
        padding: 12px 16px;
        vertical-align: middle;
        text-align: left;
      }
      .schedule-pdf-root th {
        background: rgba(249, 250, 251, 0.8);
        color: #111827;
        font-weight: 700;
        font-size: 14px;
        border-bottom: 1px solid #f3f4f6;
      }
      .schedule-pdf-root tfoot td {
        border-top: 2px solid #e5e7eb;
        background: #f9fafb;
      }
      .schedule-pdf-table-wrap {
        border: 1px solid #e5e7eb;
        border-radius: 12px;
        overflow: hidden;
      }
    </style>
    <div class="schedule-pdf-root">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;padding-bottom:16px;border-bottom:1px solid #e5e7eb">
        <img src="${fontBase}${SCHEDULE_APP_LOGO_PATH}" alt="" style="height:48px;width:auto;object-fit:contain" />
        <div>
          <p style="margin:0;font-size:18px;font-weight:700;color:#172554">${SCHEDULE_APP_NAME}</p>
          <p style="margin:2px 0 0;font-size:12px;color:#6b7280">${SCHEDULE_APP_TAGLINE}</p>
        </div>
      </div>
      <h1 style="margin:0 0 12px;font-size:16px;font-weight:600;color:#111827">តារាបង់ប្រចាំខែ</h1>
      ${memberLine}
      <div class="schedule-pdf-table-wrap">
        <table>
          <thead>
            <tr>
              ${WEB_TABLE_HEADERS.map((header) => `<th>${header}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
          ${footerHtml}
        </table>
      </div>
    </div>
  `
}

function applyThinBorder(cell: ExcelJS.Cell) {
  cell.border = {
    top: { style: 'thin', color: { argb: BORDER_COLOR } },
    left: { style: 'thin', color: { argb: BORDER_COLOR } },
    bottom: { style: 'thin', color: { argb: BORDER_COLOR } },
    right: { style: 'thin', color: { argb: BORDER_COLOR } },
  }
}

function styleHeaderCell(cell: ExcelJS.Cell, value: string) {
  cell.value = value
  cell.font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } }
  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_BLUE } }
  cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true }
  applyThinBorder(cell)
}


export async function downloadLoanScheduleExcel(options: LoanScheduleExportOptions) {
  const currency = options.currency ?? 'USD'
  const fileName = defaultFileBaseName(options)

  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'Loan Management System'
  workbook.created = new Date()

  const sheet = workbook.addWorksheet('តារាបង់', {
    views: [{ showGridLines: false }],
    properties: { defaultRowHeight: 22 },
  })

  COLUMN_WIDTHS.forEach((width, index) => {
    sheet.getColumn(index + 1).width = width
  })

  sheet.mergeCells('A1:G1')
  const titleCell = sheet.getCell('A1')
  titleCell.value = 'តារាបង់ប្រចាំខែ'
  titleCell.font = { bold: true, size: 16, color: { argb: BRAND_BLUE } }
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' }
  sheet.getRow(1).height = 30

  if (options.memberName) {
    sheet.mergeCells('A2:G2')
    const memberCell = sheet.getCell('A2')
    memberCell.value = `សមាជិក: ${options.memberName}`
    memberCell.font = { size: 11, color: { argb: 'FF4B5563' } }
    memberCell.alignment = { vertical: 'middle', horizontal: 'center' }
    sheet.getRow(2).height = 22
  }

  const headerRowIndex = (options.memberName ? 3 : 2) + 1
  const headerRow = sheet.getRow(headerRowIndex)
  headerRow.height = 28
  HEADERS.forEach((header, index) => {
    styleHeaderCell(headerRow.getCell(index + 1), header)
  })

  options.schedule.forEach((row, rowIndex) => {
    const excelRow = sheet.getRow(headerRowIndex + 1 + rowIndex)
    excelRow.height = 24

    const values: string[] = [
      String(row.month),
      formatKhmerDate(row.dueDate, '-'),
      formatMoney(row.principalPortion, currency),
      formatMoney(row.remainingBalance, currency),
      formatMoney(row.interestPortion, currency),
      formatMoney(row.amount, currency),
      formatMoney(row.paidAmount, currency),
      STATUS_LABELS[row.status],
    ]

    values.forEach((value, colIndex) => {
      const cell = excelRow.getCell(colIndex + 1)
      cell.value = value
      cell.font = {
        size: 10,
        bold: colIndex === 4 || colIndex === 6,
        color: { argb: colIndex >= 2 && colIndex <= 5 ? 'FF111827' : 'FF374151' },
      }
      cell.alignment = {
        vertical: 'middle',
        horizontal: colIndex === 0 || colIndex === 6 ? 'center' : colIndex >= 2 && colIndex <= 5 ? 'right' : 'left',
        wrapText: colIndex === 1 || colIndex === 6,
      }

      if (colIndex === 6) {
        const colors = STATUS_COLORS[row.status]
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.bg } }
        cell.font = { size: 10, bold: true, color: { argb: colors.text } }
      } else if (rowIndex % 2 === 1) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9FAFB' } }
      }

      applyThinBorder(cell)
    })
  })

  const summaryRowIndex = headerRowIndex + options.schedule.length + 2
  sheet.mergeCells(`A${summaryRowIndex}:H${summaryRowIndex}`)
  const summaryCell = sheet.getCell(`A${summaryRowIndex}`)
  summaryCell.value = formatScheduleSummary(options.schedule, currency)
  summaryCell.font = { size: 10, color: { argb: 'FF6B7280' } }
  summaryCell.alignment = { vertical: 'middle', horizontal: 'center' }
  sheet.getRow(summaryRowIndex).height = 22

  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  triggerBlobDownload(blob, `${fileName}.xlsx`)
}

export async function downloadLoanSchedulePdf(options: LoanScheduleExportOptions) {
  const fileName = defaultFileBaseName(options)

  const wrapper = document.createElement('div')
  wrapper.style.position = 'fixed'
  wrapper.style.left = '-10000px'
  wrapper.style.top = '0'
  wrapper.style.zIndex = '-1'
  wrapper.style.background = '#ffffff'

  const inner = document.createElement('div')
  inner.style.width = `${PDF_WIDTH_PX}px`
  inner.style.padding = '32px 36px'
  inner.style.boxSizing = 'border-box'
  inner.innerHTML = buildScheduleHtml(options)
  wrapper.appendChild(inner)
  document.body.appendChild(wrapper)

  try {
    await document.fonts.ready
    await Promise.all([
      document.fonts.load("400 16px 'Noto Sans Khmer'"),
      document.fonts.load("700 16px 'Noto Sans Khmer'"),
    ])

    const logoImg = inner.querySelector('img')
    if (logoImg instanceof HTMLImageElement && !logoImg.complete) {
      await new Promise<void>((resolve, reject) => {
        logoImg.onload = () => resolve()
        logoImg.onerror = () => reject(new Error('Failed to load logo'))
      })
    }

    await new Promise((resolve) => setTimeout(resolve, 100))

    const { toPng } = await import('html-to-image')
    const dataUrl = await toPng(inner, {
      pixelRatio: 2,
      backgroundColor: '#ffffff',
      cacheBust: true,
    })

    const { jsPDF } = await import('jspdf')
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()

    const img = new Image()
    img.src = dataUrl
    await img.decode()

    const imgWidth = pageWidth
    const imgHeight = (img.height * imgWidth) / img.width

    let heightLeft = imgHeight
    let position = 0

    pdf.addImage(dataUrl, 'PNG', 0, position, imgWidth, imgHeight)
    heightLeft -= pageHeight

    while (heightLeft > 0) {
      position -= pageHeight
      pdf.addPage()
      pdf.addImage(dataUrl, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight
    }

    pdf.save(`${fileName}.pdf`)
  } finally {
    document.body.removeChild(wrapper)
  }
}
