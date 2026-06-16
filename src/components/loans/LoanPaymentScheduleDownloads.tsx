'use client'

import { useState } from 'react'
import { FileDown, FileSpreadsheet } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import {
  downloadLoanScheduleExcel,
  downloadLoanSchedulePdf,
  type LoanScheduleExportOptions,
} from '@/lib/loanScheduleExport'
import { showError } from '@/lib/toast'

type LoanPaymentScheduleDownloadsProps = LoanScheduleExportOptions

export function LoanPaymentScheduleDownloads(props: LoanPaymentScheduleDownloadsProps) {
  const [pending, setPending] = useState<'pdf' | 'excel' | null>(null)

  async function handleDownload(type: 'pdf' | 'excel') {
    if (props.schedule.length === 0) return

    setPending(type)
    try {
      if (type === 'pdf') {
        await downloadLoanSchedulePdf(props)
      } else {
        await downloadLoanScheduleExcel(props)
      }
    } catch {
      showError('មិនអាចទាញយកឯកសារបានទេ។')
    } finally {
      setPending(null)
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        loading={pending === 'excel'}
        disabled={pending !== null}
        onClick={() => handleDownload('excel')}
      >
        <FileSpreadsheet className="h-4 w-4" />
        Excel
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        loading={pending === 'pdf'}
        disabled={pending !== null}
        onClick={() => handleDownload('pdf')}
      >
        <FileDown className="h-4 w-4" />
        PDF
      </Button>
    </div>
  )
}
