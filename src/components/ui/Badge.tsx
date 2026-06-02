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
    <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-medium ${variantClasses[variant]} ${className}`}>
      {children}
    </span>
  )
}

export function MemberStatusBadge({ status }: { status: MemberStatus }) {
  const config: Record<MemberStatus, { label: string; variant: BadgeVariant }> = {
    pending: { label: 'រង់ចាំ', variant: 'warning' },
    active: { label: 'សកម្ម', variant: 'success' },
    suspended: { label: 'ផ្អាក', variant: 'error' },
    withdrawn: { label: 'បានដក', variant: 'default' },
    rejected: { label: 'បដិសេធ', variant: 'error' },
  }
  const { label, variant } = config[status]
  return <Badge variant={variant}>{label}</Badge>
}

export function LoanStatusBadge({ status }: { status: LoanStatus }) {
  const config: Record<LoanStatus, { label: string; variant: BadgeVariant }> = {
    pending: { label: 'រង់ចាំ', variant: 'warning' },
    under_review: { label: 'កំពុងពិនិត្យ', variant: 'info' },
    approved: { label: 'បានទទួលយក', variant: 'success' },
    active: { label: 'សកម្ម', variant: 'success' },
    completed: { label: 'បានបញ្ចប់', variant: 'default' },
    rejected: { label: 'បានបដិសេធ', variant: 'error' },
  }
  const { label, variant } = config[status]
  return <Badge variant={variant}>{label}</Badge>
}

export function SavingStatusBadge({ status }: { status: SavingStatus }) {
  const config: Record<SavingStatus, { label: string; variant: BadgeVariant }> = {
    pending: { label: 'រង់ចាំ', variant: 'warning' },
    verified: { label: 'បានផ្ទៀងផ្ទាត់', variant: 'info' },
    completed: { label: 'បានបញ្ចប់', variant: 'success' },
    refunded: { label: 'បានសងប្រាក់វិញ', variant: 'error' },
  }
  const { label, variant } = config[status]
  return <Badge variant={variant}>{label}</Badge>
}

export function CapitalRequestStatusBadge({ status }: { status: CapitalRequestStatus }) {
  const config: Record<CapitalRequestStatus, { label: string; variant: BadgeVariant }> = {
    pending: { label: 'រង់ចាំ', variant: 'warning' },
    approved: { label: 'បានទទួលយក', variant: 'success' },
    rejected: { label: 'បានបដិសេធ', variant: 'error' },
  }
  const { label, variant } = config[status]
  return <Badge variant={variant}>{label}</Badge>
}
