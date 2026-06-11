'use client'

import { Send } from 'lucide-react'
import { markReportSent } from '@/app/actions/admin'
import { AdminActionButton, AdminActionsMenu } from '@/components/admin'

export function ReportRequestActions({ reportId, status }: { reportId: string; status: string }) {
  if (status !== 'pending') {
    return <span className="text-xs text-muted">—</span>
  }

  return (
    <AdminActionsMenu align="left">
      <AdminActionButton action={markReportSent} id={reportId} menuItem icon={Send}>
        សម្គាល់ថាបានផ្ញើ
      </AdminActionButton>
    </AdminActionsMenu>
  )
}
