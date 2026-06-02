'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { ActionResult } from '@/app/actions/member'
import { Button } from '@/components/ui/Button'
import { showError, showSuccess } from '@/lib/toast'

type AdminActionButtonProps = {
  action: (formData: FormData) => Promise<ActionResult>
  id: string
  children: React.ReactNode
  decision?: string
  variant?: 'primary' | 'secondary' | 'outline' | 'danger'
  successMessage?: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

/** @deprecated Use `variant` instead */
type LegacyProps = AdminActionButtonProps & {
  danger?: boolean
  secondary?: boolean
}

export function AdminActionButton({
  action,
  id,
  children,
  decision,
  variant,
  danger = false,
  secondary = false,
  successMessage = 'បានធ្វើបច្ចុប្នភាពដោយជោគជ័យ។',
  className = '',
  size = 'sm',
}: LegacyProps) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  const resolvedVariant =
    variant ?? (danger ? 'danger' : secondary ? 'outline' : 'primary')

  function handleClick() {
    const formData = new FormData()
    formData.set('id', id)
    if (decision) formData.set('decision', decision)

    startTransition(async () => {
      const result = await action(formData)
      if (result.success) {
        showSuccess(successMessage)
        router.refresh()
        return
      }
      showError(result.error ?? 'មានបញ្ហាកើតឡើង។ សូមព្យាយាមម្តងទៀត។')
    })
  }

  return (
    <Button
      type="button"
      variant={resolvedVariant}
      size={size}
      loading={pending}
      onClick={handleClick}
      className={className}
    >
      {pending ? 'កំពុងដំណើរការ...' : children}
    </Button>
  )
}
