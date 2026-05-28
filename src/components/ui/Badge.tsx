import React from 'react'
import type { MemberStatus, LoanStatus, SavingStatus, CapitalRequestStatus } from '@/types/database'

type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info'

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  className?: string
}

export function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  const variantClasses = {
    default: 'bg-gray-100 text-gray-700',
    success: 'bg-green-100 text-green-700',
    warning: 'bg-yellow-100 text-yellow-700',
    error: 'bg-red-100 text-red-700',
    info: 'bg-blue-100 text-blue-700',
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variantClasses[variant]} ${className}`}>
      {children}
    </span>
  )
}

export function MemberStatusBadge({ status }: { status: MemberStatus }) {
  const config: Record<MemberStatus, { label: string; variant: BadgeVariant }> = {
    pending: { label: 'Pending', variant: 'warning' },
    active: { label: 'Active', variant: 'success' },
    suspended: { label: 'Suspended', variant: 'error' },
    withdrawn: { label: 'Withdrawn', variant: 'default' },
  }
  const { label, variant } = config[status]
  return <Badge variant={variant}>{label}</Badge>
}

export function LoanStatusBadge({ status }: { status: LoanStatus }) {
  const config: Record<LoanStatus, { label: string; variant: BadgeVariant }> = {
    pending: { label: 'Pending', variant: 'warning' },
    under_review: { label: 'Under Review', variant: 'info' },
    approved: { label: 'Approved', variant: 'success' },
    active: { label: 'Active', variant: 'success' },
    completed: { label: 'Completed', variant: 'default' },
    rejected: { label: 'Rejected', variant: 'error' },
  }
  const { label, variant } = config[status]
  return <Badge variant={variant}>{label}</Badge>
}

export function SavingStatusBadge({ status }: { status: SavingStatus }) {
  const config: Record<SavingStatus, { label: string; variant: BadgeVariant }> = {
    pending: { label: 'Pending', variant: 'warning' },
    verified: { label: 'Verified', variant: 'info' },
    completed: { label: 'Completed', variant: 'success' },
  }
  const { label, variant } = config[status]
  return <Badge variant={variant}>{label}</Badge>
}

export function CapitalRequestStatusBadge({ status }: { status: CapitalRequestStatus }) {
  const config: Record<CapitalRequestStatus, { label: string; variant: BadgeVariant }> = {
    pending: { label: 'Pending', variant: 'warning' },
    approved: { label: 'Approved', variant: 'success' },
    rejected: { label: 'Rejected', variant: 'error' },
  }
  const { label, variant } = config[status]
  return <Badge variant={variant}>{label}</Badge>
}
