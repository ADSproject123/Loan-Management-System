'use client'

import { RotateCcw, type LucideIcon } from 'lucide-react'
import { refundSaving } from '@/app/actions/admin'
import { AdminReasonDialogButton } from '@/components/admin/AdminReasonDialogButton'

type RefundSavingButtonProps = {
  savingId: string
  memberName?: string
  amountLabel?: string
  label?: string
  className?: string
  menuItem?: boolean
  icon?: LucideIcon
}

export function RefundSavingButton({
  savingId,
  memberName,
  amountLabel,
  label = 'សងប្រាក់',
  className = '',
  menuItem = false,
  icon = RotateCcw,
}: RefundSavingButtonProps) {
  const description = [
    memberName ? `សងប្រាក់សន្សំរបស់ ${memberName}។` : null,
    amountLabel,
    'សមាជិកនឹងទទួលបានការជូនដំណឹងជាមួយមូលហេតុ។ ការសន្សំនេះនឹងមិនត្រូវបញ្ចូលទៅសមតុល្យទេ។',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <AdminReasonDialogButton
      action={refundSaving}
      id={savingId}
      label={label}
      dialogTitle="សងប្រាក់សន្សំវិញ"
      dialogDescription={description}
      reasonLabel="មូលហេតុសងប្រាក់វិញ"
      reasonPlaceholder="ឧ. ភស្តុតាងមិនត្រឹមត្រូវ ឬចំនួនទឹកប្រាក់មិនផ្គូផ្គង..."
      confirmLabel={`បញ្ជាក់${label}`}
      successMessage="បានសងប្រាក់វិញដោយជោគជ័យ។"
      menuItem={menuItem}
      icon={icon}
      dialogIcon={RotateCcw}
      className={className}
    />
  )
}
