import React from 'react'
import type { MemberStatus, MemberRole, LoanStatus, SavingStatus, CapitalRequestStatus } from '@/types/database'

export const MEMBER_ROLE_LABELS: Record<MemberRole, string> = {
  founder: 'Founder',
  comember: 'Core member',
  member: 'Member',
}

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info'

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  className?: string
  plain?: boolean
}

export function Badge({ children, variant = 'default', className = '', plain = false }: BadgeProps) {
  const variantClasses = {
    default: 'bg-gray-100 text-gray-700',
    success: 'bg-green-100 text-green-700',
    warning: 'bg-yellow-100 text-yellow-700',
    error: 'bg-red-100 text-red-700',
    info: 'bg-brand-100 text-brand-700',
  }

  const plainVariantClasses = {
    default: 'text-muted',
    success: 'text-green-700',
    warning: 'text-amber-600',
    error: 'text-red-600',
    info: 'text-brand-700',
  }

  if (plain) {
    return (
      <span className={`text-sm font-medium ${plainVariantClasses[variant]} ${className}`}>
        {children}
      </span>
    )
  }

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variantClasses[variant]} ${className}`}>
      {children}
    </span>
  )
}

export function MemberStatusBadge({ status, plain = false }: { status: MemberStatus; plain?: boolean }) {
  const config: Record<MemberStatus, { label: string; variant: BadgeVariant }> = {
    pending: { label: 'រង់ចាំ', variant: 'warning' },
    active: { label: 'សកម្ម', variant: 'success' },
    suspended: { label: 'ផ្អាក', variant: 'error' },
    withdrawn: { label: 'បានដក', variant: 'default' },
    rejected: { label: 'បដិសេធ', variant: 'error' },
  }
  const { label, variant } = config[status]
  return <Badge variant={variant} plain={plain}>{label}</Badge>
}

export function MemberRoleBadge({ role, plain = false }: { role: MemberRole; plain?: boolean }) {
  const config: Record<MemberRole, { variant: BadgeVariant }> = {
    founder: { variant: 'info' },
    comember: { variant: 'warning' },
    member: { variant: 'default' },
  }
  return (
    <Badge variant={config[role].variant} plain={plain}>
      {MEMBER_ROLE_LABELS[role]}
    </Badge>
  )
}

export function LoanStatusBadge({ status, plain = false }: { status: LoanStatus; plain?: boolean }) {
  const config: Record<LoanStatus, { label: string; variant: BadgeVariant }> = {
    pending: { label: 'រង់ចាំ', variant: 'warning' },
    under_review: { label: 'កំពុងពិនិត្យ', variant: 'info' },
    approved: { label: 'បានទទួលយក', variant: 'success' },
    active: { label: 'សកម្ម', variant: 'success' },
    completed: { label: 'បានទទួល', variant: 'default' },
    rejected: { label: 'បានបដិសេធ', variant: 'error' },
  }
  const { label, variant } = config[status]
  return <Badge variant={variant} plain={plain}>{label}</Badge>
}

export function SavingStatusBadge({ status, plain = false }: { status: SavingStatus; plain?: boolean }) {
  const config: Record<SavingStatus, { label: string; variant: BadgeVariant }> = {
    pending: { label: 'រង់ចាំ', variant: 'warning' },
    verified: { label: 'បានទទួល', variant: 'info' },
    completed: { label: 'បានទទួល', variant: 'success' },
    refunded: { label: 'បានសងប្រាក់វិញ', variant: 'error' },
  }
  const { label, variant } = config[status]
  return <Badge variant={variant} plain={plain}>{label}</Badge>
}

export function CapitalRequestStatusBadge({
  status,
  plain = false,
}: {
  status: CapitalRequestStatus
  plain?: boolean
}) {
  const config: Record<CapitalRequestStatus, { label: string; variant: BadgeVariant }> = {
    pending: { label: 'រង់ចាំ', variant: 'warning' },
    approved: { label: 'បានទទួលយក', variant: 'success' },
    rejected: { label: 'បានបដិសេធ', variant: 'error' },
  }
  const { label, variant } = config[status]
  return <Badge variant={variant} plain={plain}>{label}</Badge>
}

const REPORT_STATUS_CONFIG: Record<string, { label: string; variant: BadgeVariant }> = {
  pending: { label: 'រង់ចាំ', variant: 'warning' },
  sent: { label: 'បានផ្ញើ', variant: 'success' },
  failed: { label: 'បរាជ័យ', variant: 'error' },
}

export function ReportRequestStatusBadge({
  status,
  plain = true,
}: {
  status: string
  plain?: boolean
}) {
  const { label, variant } = REPORT_STATUS_CONFIG[status] ?? {
    label: status,
    variant: 'default' as BadgeVariant,
  }
  return <Badge variant={variant} plain={plain}>{label}</Badge>
}
