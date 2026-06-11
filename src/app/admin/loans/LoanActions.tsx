'use client'

import { CheckCircle2, CirclePlay, Trash2 } from 'lucide-react'
import { activateLoan, approveLoan, rejectLoan } from '@/app/actions/admin'
import { AdminActionButton, AdminActionsMenu, AdminReasonDialogButton } from '@/components/admin'
import type { LoanStatus } from '@/types/database'

type LoanActionsProps = {
  loanId: string
  status: LoanStatus
  className?: string
}

export function LoanActions({ loanId, status, className = '' }: LoanActionsProps) {
  const canApprove = status === 'under_review' || status === 'pending'
  const canActivate = status === 'approved'
  const canReject = canApprove || canActivate

  if (!canApprove && !canActivate && !canReject) {
    return <span className="text-xs text-gray-400">—</span>
  }

  return (
    <div className={className}>
      <AdminActionsMenu>
        {canApprove && (
          <AdminActionButton
            action={approveLoan}
            id={loanId}
            menuItem
            icon={CheckCircle2}
            successMessage="បានទទួលយកពាក្យសុំកម្ជីដោយជោគជ័យ។"
          >
            ទទួលយក
          </AdminActionButton>
        )}
        {canActivate && (
          <AdminActionButton
            action={activateLoan}
            id={loanId}
            menuItem
            icon={CirclePlay}
            successMessage="កម្ជីត្រូវបានដំណើរការដោយជោគជ័យ។"
          >
            ដំណើរការ
          </AdminActionButton>
        )}
        {canReject && (
          <AdminReasonDialogButton
            action={rejectLoan}
            id={loanId}
            label="បដិសេធ"
            menuItem
            icon={Trash2}
            dialogTitle="បដិសេធពាក្យសុំកម្ជី"
            dialogDescription="សមាជិកនឹងទទួលការជូនដំណឹងជាមួយមូលហេតុបដិសេធ។"
            reasonLabel="មូលហេតុបដិសេធ"
            reasonPlaceholder="ពិពណ៌នាមូលហេតុដែលពាក្យសុំកម្ជីត្រូវបានបដិសេធ..."
            confirmLabel="បញ្ជាក់បដិសេធ"
            successMessage="បានបដិសេធពាក្យសុំកម្ជី។"
          />
        )}
      </AdminActionsMenu>
    </div>
  )
}
