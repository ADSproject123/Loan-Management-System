'use client'

import { useState } from 'react'
import { FileDown } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import {
  downloadLoanSchedulePdf,
  type LoanScheduleExportOptions,
} from '@/lib/loanScheduleExport'
import { showError } from '@/lib/toast'

type LoanPaymentScheduleDownloadsProps = LoanScheduleExportOptions

export function LoanPaymentScheduleDownloads(props: LoanPaymentScheduleDownloadsProps) {
  const [pending, setPending] = useState(false)

  async function handleDownload() {
    if (props.schedule.length === 0) return
    setPending(true)
    try {
      await downloadLoanSchedulePdf(props)
    } catch {
      showError('មិនអាចទាញយកឯកសារបានទេ។')
    } finally {
      setPending(false)
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      loading={pending}
      disabled={pending}
      onClick={handleDownload}
    >
      <FileDown className="h-4 w-4" />
      PDF
    </Button>
  )
}
