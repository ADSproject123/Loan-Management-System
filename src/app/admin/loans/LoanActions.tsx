'use client'

import { activateLoan, approveLoan, rejectLoan } from '@/app/actions/admin'
import { AdminActionButton } from '@/components/admin'
import type { LoanStatus } from '@/types/database'

type LoanActionsProps = {
  loanId: string
  status: LoanStatus
  className?: string
}

export function LoanActions({ loanId, status, className = '' }: LoanActionsProps) {
  const canReject = status !== 'rejected' && status !== 'completed'

  if (status !== 'under_review' && status !== 'approved' && !canReject) {
    return <span className="text-xs text-gray-400">—</span>
  }

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      {status === 'under_review' && (
        <AdminActionButton
          action={approveLoan}
          id={loanId}
          successMessage="បានទទួលយកពាក្យសុំកម្ជីដោយជោគជ័យ។"
        >
          ទទួលយក
        </AdminActionButton>
      )}
      {status === 'approved' && (
        <AdminActionButton
          action={activateLoan}
          id={loanId}
          successMessage="កម្ជីត្រូវបានដំណើរការដោយជោគជ័យ។"
        >
          ដំណើរការ
        </AdminActionButton>
      )}
      {canReject && (
        <AdminActionButton
          action={rejectLoan}
          id={loanId}
          variant="danger"
          successMessage="បានបដិសេធពាក្យសុំកម្ជី។"
        >
          បដិសេធ
        </AdminActionButton>
      )}
    </div>
  )
}
