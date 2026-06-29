import React from 'react'
import { AlertTriangle } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

type AlertVariant = 'warning' | 'info'

interface AlertBannerProps {
  variant?: AlertVariant
  icon?: LucideIcon
  children: React.ReactNode
  className?: string
}

const variantStyles: Record<AlertVariant, { container: string; icon: string }> = {
  warning: {
    container: 'border-amber-200 bg-amber-50',
    icon: 'text-amber-600',
  },
  info: {
    container: 'border-yellow-200 bg-yellow-50',
    icon: 'text-yellow-600',
  },
}

const defaultIcons: Record<AlertVariant, LucideIcon> = {
  warning: AlertTriangle,
  info: AlertTriangle,
}

export function AlertBanner({ variant = 'warning', icon, children, className = '' }: AlertBannerProps) {
  const styles = variantStyles[variant]
  const Icon = icon ?? defaultIcons[variant]

  return (
    <div className={`flex items-start gap-3 rounded-xl border p-4 ${styles.container} ${className}`}>
      <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${styles.icon}`} />
      <div className="text-sm">{children}</div>
    </div>
  )
}
