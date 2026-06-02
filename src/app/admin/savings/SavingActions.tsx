'use client'

import { approveSaving } from '@/app/actions/admin'
import { AdminActionButton } from '@/components/admin'
import { RefundSavingButton } from '@/app/admin/savings/RefundSavingButton'
import { money } from '@/app/admin/adminUtils'
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
    <div className="flex flex-wrap items-center justify-end gap-2">
      <AdminActionButton
        action={approveSaving}
        id={savingId}
        successMessage="បានអនុម័តការសន្សំដោយជោគជ័យ។"
      >
        អនុម័ត
      </AdminActionButton>
      <RefundSavingButton
        savingId={savingId}
        memberName={memberName}
        amountLabel={amountLabel}
        label="សងប្រាក់"
      />
    </div>
  )
}
