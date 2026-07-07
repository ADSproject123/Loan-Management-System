'use client'

import { UserX, type LucideIcon } from 'lucide-react'
import { denyMember } from '@/app/actions/admin'
import { AdminReasonDialogButton } from '@/components/admin/AdminReasonDialogButton'

type DenyMemberButtonProps = {
  memberId: string
  memberName?: string
  label?: string
  className?: string
  menuItem?: boolean
  icon?: LucideIcon
}

export function DenyMemberButton({
  memberId,
  memberName,
  label = 'បដិសេធ',
  className = '',
  menuItem = false,
  icon = UserX,
}: DenyMemberButtonProps) {
  const description = memberName
    ? `បដិសេធការចុះឈ្មោះរបស់ ${memberName}។ សមាជិកនឹងឃើញមូលហេតុនៅលើទំព័រស្ថានភាពគណនី។`
    : 'ការចុះឈ្មោះនឹងត្រូវបានបដិសេធ ហើយសមាជិកនឹងឃើញមូលហេតុនៅលើទំព័រស្ថានភាពគណនី។'

  return (
    <AdminReasonDialogButton
      action={denyMember}
      id={memberId}
      label={label}
      dialogTitle="បដិសេធការចុះឈ្មោះ"
      dialogDescription={description}
      reasonLabel="មូលហេតុបដិសេធ"
      reasonPlaceholder="ពិពណ៌នាមូលហេតុដែលការចុះឈ្មោះត្រូវបានបដិសេធ..."
      confirmLabel="បញ្ជាក់បដិសេធ"
      pendingLabel="កំពុងបដិសេធ..."
      successMessage="បានបដិសេធការចុះឈ្មោះដោយជោគជ័យ។"
      menuItem={menuItem}
      icon={icon}
      dialogIcon={UserX}
      className={className}
    />
  )
}
