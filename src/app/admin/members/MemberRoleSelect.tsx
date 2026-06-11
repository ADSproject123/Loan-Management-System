'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown } from 'lucide-react'
import { updateMemberRole } from '@/app/actions/admin'
import { MEMBER_ROLE_LABELS } from '@/components/ui/Badge'
import { showError, showSuccess } from '@/lib/toast'
import type { MemberRole } from '@/types/database'

const ROLE_VALUES: MemberRole[] = ['founder', 'comember', 'member']

export function MemberRoleSelect({
  memberId,
  role,
}: {
  memberId: string
  role: MemberRole
}) {
  const router = useRouter()
  const [value, setValue] = useState<MemberRole>(role)
  const [pending, startTransition] = useTransition()

  function handleChange(next: MemberRole) {
    if (next === value) return
    const previous = value
    setValue(next)

    const formData = new FormData()
    formData.set('id', memberId)
    formData.set('role', next)

    startTransition(async () => {
      const result = await updateMemberRole(formData)
      if (result.success) {
        showSuccess('បានប្តូរតួនាទីដោយជោគជ័យ។')
        router.refresh()
        return
      }
      setValue(previous)
      showError(result.error ?? 'មិនអាចប្តូរតួនាទីបានទេ។')
    })
  }

  return (
    <div className="relative inline-flex items-center">
      <select
        value={value}
        disabled={pending}
        onChange={(event) => handleChange(event.target.value as MemberRole)}
        className="appearance-none rounded-lg border border-border bg-surface py-1.5 pl-3 pr-8 text-xs font-semibold text-foreground shadow-xs transition hover:border-brand-300 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100 disabled:opacity-60"
      >
        {ROLE_VALUES.map((roleValue) => (
          <option key={roleValue} value={roleValue}>
            {MEMBER_ROLE_LABELS[roleValue]}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2 h-4 w-4 text-muted" />
    </div>
  )
}
