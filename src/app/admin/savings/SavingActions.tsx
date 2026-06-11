'use client'

import { CheckCircle2, RotateCcw } from 'lucide-react'
import { approveSaving } from '@/app/actions/admin'
import { RefundSavingButton } from '@/app/admin/savings/RefundSavingButton'
import { money } from '@/app/admin/adminUtils'
import { AdminActionButton, AdminActionsMenu } from '@/components/admin'
import type { CurrencyCode } from '@/lib/currency'

type SavingActionsProps = {
  savingId: string
  memberName: string
  amount: number | null
  currency: string | null
  status: string
}

export function SavingActions({
  savingId,
  memberName,
  amount,
  currency,
  status,
}: SavingActionsProps) {
  if (status !== 'pending') return null

  const amountLabel = money(amount, (currency as CurrencyCode) ?? 'USD')

  return (
    <AdminActionsMenu>
      <AdminActionButton
        action={approveSaving}
        id={savingId}
        menuItem
        icon={CheckCircle2}
        successMessage="បានទទួលការសន្សំដោយជោគជ័យ។"
      >
        បានទទួល
      </AdminActionButton>
      <RefundSavingButton
        savingId={savingId}
        memberName={memberName}
        amountLabel={amountLabel}
        label="សងប្រាក់"
        menuItem
        icon={RotateCcw}
      />
    </AdminActionsMenu>
  )
}
