'use client'

import { Ban, Pencil, UserCheck, UserX, X } from 'lucide-react'
import { AcceptMemberButton } from '@/app/admin/AcceptMemberButton'
import { SuspendMemberButton } from '@/app/admin/SuspendMemberButton'
import { DenyMemberButton } from '@/app/admin/DenyMemberButton'
import { AdminActionsMenu, AdminActionsMenuItem } from '@/components/admin'
import { Button } from '@/components/ui/Button'
import { useMemberEditMode } from './MemberEditModeContext'
import type { MemberStatus } from '@/types/database'

type MemberDetailHeaderActionsProps = {
  memberId: string
  memberName: string
  status: MemberStatus
}

export function MemberDetailHeaderActions({
  memberId,
  memberName,
  status,
}: MemberDetailHeaderActionsProps) {
  const { isEditing, setIsEditing, exitEditMode, isSaving, hasSaveForm, triggerSave } =
    useMemberEditMode()

  return (
    <div className="flex items-center gap-2">
      {isEditing && (
        <Button
          type="button"
          size="sm"
          loading={isSaving}
          disabled={!hasSaveForm || isSaving}
          onClick={triggerSave}
        >
          រក្សាទុក
        </Button>
      )}
      <AdminActionsMenu align="right">
      {!isEditing && status !== 'active' && status !== 'rejected' && (
        <AcceptMemberButton
          memberId={memberId}
          memberName={memberName}
          label="ទទួលយកសមាជិក"
          menuItem
          icon={UserCheck}
        />
      )}
      {!isEditing && status === 'pending' && (
        <DenyMemberButton
          memberId={memberId}
          memberName={memberName}
          label="បដិសេធ"
          menuItem
          icon={UserX}
        />
      )}
      {!isEditing && status !== 'suspended' && status !== 'pending' && status !== 'rejected' && (
        <SuspendMemberButton
          memberId={memberId}
          memberName={memberName}
          label="ផ្អាកគណនី"
          menuItem
          icon={Ban}
        />
      )}
      <AdminActionsMenuItem
        icon={isEditing ? X : Pencil}
        label={isEditing ? 'បោះបង់' : 'កែប្រែ'}
        onClick={() => (isEditing ? exitEditMode() : setIsEditing(true))}
      />
    </AdminActionsMenu>
    </div>
  )
}
