'use client'

import { Ban, type LucideIcon } from 'lucide-react'
import { suspendMember } from '@/app/actions/admin'
import { AdminReasonDialogButton } from '@/components/admin/AdminReasonDialogButton'

type SuspendMemberButtonProps = {
  memberId: string
  memberName?: string
  label?: string
  className?: string
  menuItem?: boolean
  icon?: LucideIcon
}

export function SuspendMemberButton({
  memberId,
  memberName,
  label = 'ផ្អាកគណនី',
  className = '',
  menuItem = false,
  icon = Ban,
}: SuspendMemberButtonProps) {
  const description = memberName
    ? `ផ្អាកគណនីរបស់ ${memberName}។ សមាជិកនឹងមិនអាចចូលប្រើប្រព័ន្ធបាន ហើយនឹងឃើញមូលហេតុនៅលើទំព័រស្ថានភាពគណនី។`
    : 'សមាជិកនឹងមិនអាចចូលប្រើប្រព័ន្ធបាន ហើយនឹងឃើញមូលហេតុនៅលើទំព័រស្ថានភាពគណនី។'

  return (
    <AdminReasonDialogButton
      action={suspendMember}
      id={memberId}
      label={label}
      dialogTitle="ផ្អាកគណនី"
      dialogDescription={description}
      reasonLabel="មូលហេតុផ្អាក"
      reasonPlaceholder="ពិពណ៌នាមូលហេតុដែលគណនីត្រូវបានផ្អាក..."
      confirmLabel="បញ្ជាក់ផ្អាក"
      pendingLabel="កំពុងផ្អាក..."
      successMessage="បានផ្អាកគណនីសមាជិកដោយជោគជ័យ។"
      menuItem={menuItem}
      icon={icon}
      dialogIcon={Ban}
      className={className}
    />
  )
}
