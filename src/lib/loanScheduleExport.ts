import ExcelJS from 'exceljs'
import { formatKhmerDate } from '@/lib/dates'
import { formatMoney, type CurrencyCode } from '@/lib/currency'
import type { LoanScheduleRow } from '@/lib/interestCalculations'

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

type PdfMakeInstance = {
  vfs: Record<string, string>
  fonts: Record<string, { normal: string; bold: string }>
  createPdf: (doc: unknown) => { download: (name: string) => void }
  addVirtualFileSystem: (vfs: Record<string, string>) => void
}

let pdfMakeReady: Promise<PdfMakeInstance> | null = null

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

function arrayBufferToBase64(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  const chunkSize = 0x8000
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize))
  }
  return btoa(binary)
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


async function getPdfMake() {
  if (!pdfMakeReady) {
    pdfMakeReady = (async () => {
      const pdfMakeModule = await import('pdfmake/build/pdfmake')
      const pdfFontsModule = await import('pdfmake/build/vfs_fonts')
      const pdfMake = pdfMakeModule.default as unknown as PdfMakeInstance
      const vfsFonts = pdfFontsModule.default as { pdfMake?: { vfs?: Record<string, string> } }

      // Register bundled fonts (Roboto etc.) into the singleton VFS via the
      // proper API. Setting pdfMake.vfs[key] directly is ignored — pdfmake
      // reads from an internal singleton (VirtualFileSystem) that is only
      // populated through addVirtualFileSystem → singleton.writeFileSync().
      if (vfsFonts.pdfMake?.vfs) {
        pdfMake.addVirtualFileSystem(vfsFonts.pdfMake.vfs)
      }

      const [regularRes, boldRes] = await Promise.all([
        fetch('/fonts/NotoSansKhmer-Regular.ttf'),
        fetch('/fonts/NotoSansKhmer-Bold.ttf'),
      ])

      if (!regularRes.ok || !boldRes.ok) {
        throw new Error(`Failed to load Khmer fonts (${regularRes.status} / ${boldRes.status})`)
      }

      const [regular, bold] = await Promise.all([
        regularRes.arrayBuffer(),
        boldRes.arrayBuffer(),
      ])

      pdfMake.addVirtualFileSystem({
        'NotoSansKhmer-Regular.ttf': arrayBufferToBase64(regular),
        'NotoSansKhmer-Bold.ttf': arrayBufferToBase64(bold),
      })

      pdfMake.fonts = {
        ...pdfMake.fonts,
        NotoSansKhmer: {
          normal: 'NotoSansKhmer-Regular.ttf',
          bold: 'NotoSansKhmer-Bold.ttf',
        },
      }

      return pdfMake
    })()
  }

  return pdfMakeReady
}

export async function downloadLoanScheduleExcel(options: LoanScheduleExportOptions) {
  const currency = options.currency ?? 'USD'
  const totalDue = options.schedule.reduce((sum, row) => sum + row.amount, 0)
  const totalPaid = options.schedule.reduce((sum, row) => sum + row.paidAmount, 0)
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

  const summaryRow = options.memberName ? 3 : 2
  sheet.mergeCells(`A${summaryRow}:G${summaryRow}`)
  const summaryCell = sheet.getCell(`A${summaryRow}`)
  summaryCell.value = `ការបង់ ${options.schedule.length} ដង | សរុប ${formatMoney(totalDue, currency)} | បានបង់ ${formatMoney(totalPaid, currency)}`
  summaryCell.font = { size: 10, color: { argb: 'FF6B7280' } }
  summaryCell.alignment = { vertical: 'middle', horizontal: 'center' }
  sheet.getRow(summaryRow).height = 20

  const headerRowIndex = summaryRow + 2
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

  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  triggerBlobDownload(blob, `${fileName}.xlsx`)
}

export async function downloadLoanSchedulePdf(options: LoanScheduleExportOptions) {
  const pdfMake = await getPdfMake()
  const currency = options.currency ?? 'USD'
  const totalDue = options.schedule.reduce((sum, row) => sum + row.amount, 0)
  const totalPaid = options.schedule.reduce((sum, row) => sum + row.paidAmount, 0)
  const fileName = defaultFileBaseName(options)

  const headerRow = HEADERS.map((header) => ({
    text: header,
    bold: true,
    fontSize: 10,
    color: '#ffffff',
    fillColor: '#1e3a8a',
    alignment: 'center' as const,
    margin: [0, 6, 0, 6] as [number, number, number, number],
  }))

  const dataRows = options.schedule.map((row, index) => {
    const colors = STATUS_COLORS[row.status]
    const rowFill = index % 2 === 1 ? '#f9fafb' : undefined

    return [
      { text: String(row.month), alignment: 'center' as const, fillColor: rowFill, margin: [0, 5, 0, 5] as [number, number, number, number] },
      { text: formatKhmerDate(row.dueDate, '-'), fillColor: rowFill, margin: [0, 5, 0, 5] as [number, number, number, number] },
      { text: formatMoney(row.principalPortion, currency), alignment: 'right' as const, fillColor: rowFill, margin: [0, 5, 0, 5] as [number, number, number, number] },
      { text: formatMoney(row.remainingBalance, currency), alignment: 'right' as const, fillColor: rowFill, margin: [0, 5, 0, 5] as [number, number, number, number] },
      { text: formatMoney(row.interestPortion, currency), alignment: 'right' as const, fillColor: rowFill, margin: [0, 5, 0, 5] as [number, number, number, number] },
      { text: formatMoney(row.amount, currency), alignment: 'right' as const, bold: true, fillColor: rowFill, margin: [0, 5, 0, 5] as [number, number, number, number] },
      { text: formatMoney(row.paidAmount, currency), alignment: 'right' as const, fillColor: rowFill, margin: [0, 5, 0, 5] as [number, number, number, number] },
      {
        text: STATUS_LABELS[row.status],
        alignment: 'center' as const,
        bold: true,
        fontSize: 9,
        color: `#${colors.text.slice(2)}`,
        fillColor: `#${colors.bg.slice(2)}`,
        margin: [0, 5, 0, 5] as [number, number, number, number],
      },
    ]
  })

  const content: unknown[] = [
    {
      text: 'តារាបង់ប្រចាំខែ',
      fontSize: 18,
      bold: true,
      color: '#1e3a8a',
      alignment: 'center',
      margin: [0, 0, 0, 6],
    },
  ]

  if (options.memberName) {
    content.push({
      text: `សមាជិក: ${options.memberName}`,
      fontSize: 11,
      color: '#4b5563',
      alignment: 'center',
      margin: [0, 0, 0, 4],
    })
  }

  content.push({
    text: `ការបង់ ${options.schedule.length} ដង | សរុប ${formatMoney(totalDue, currency)} | បានបង់ ${formatMoney(totalPaid, currency)}`,
    fontSize: 10,
    color: '#6b7280',
    alignment: 'center',
    margin: [0, 0, 0, 14],
  })

  content.push({
    table: {
      headerRows: 1,
      widths: [20, 66, 50, 50, 50, 56, 50, 54],
      body: [headerRow, ...dataRows],
    },
    layout: {
      hLineWidth: () => 0.5,
      vLineWidth: () => 0.5,
      hLineColor: () => '#e5e7eb',
      vLineColor: () => '#e5e7eb',
      paddingLeft: () => 6,
      paddingRight: () => 6,
      paddingTop: () => 4,
      paddingBottom: () => 4,
    },
  })

  pdfMake.createPdf({
    pageSize: 'A4',
    pageMargins: [36, 42, 36, 42],
    defaultStyle: {
      font: 'NotoSansKhmer',
      fontSize: 10,
    },
    content,
  }).download(`${fileName}.pdf`)
}
