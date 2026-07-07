'use client'

import { Children, type ReactNode } from 'react'
import { type LucideIcon } from 'lucide-react'

export function adminMenuItemClass(destructive = false) {
  return [
    'inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 whitespace-nowrap',
    destructive
      ? 'border-red-200 bg-white text-red-700 hover:bg-red-50'
      : 'border-border bg-white text-foreground hover:bg-surface-muted',
  ].join(' ')
}

/** @deprecated Use adminMenuItemClass() with menuItem prop on action buttons */
export const adminActionsMenuItemClassName = adminMenuItemClass()

type AdminActionsMenuProps = {
  children: ReactNode
  align?: 'left' | 'right'
}

export function AdminActionsMenu({ children, align = 'right' }: AdminActionsMenuProps) {
  const items = Children.toArray(children).filter(Boolean)

  if (items.length === 0) {
    return <span className="text-xs text-muted">—</span>
  }

  return (
    <div
      className={`flex flex-wrap items-center gap-1.5 ${
        align === 'right' ? 'justify-end' : 'justify-start'
      }`}
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
    >
      {items}
    </div>
  )
}

type AdminActionsMenuItemProps = {
  icon: LucideIcon
  label: string
  destructive?: boolean
  disabled?: boolean
  onClick: () => void
}

export function AdminActionsMenuItem({
  icon: Icon,
  label,
  destructive = false,
  disabled = false,
  onClick,
}: AdminActionsMenuItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={adminMenuItemClass(destructive)}
    >
      <Icon
        className={`h-3.5 w-3.5 shrink-0 ${destructive ? 'text-red-500' : 'text-foreground'}`}
        strokeWidth={1.75}
      />
      <span>{label}</span>
    </button>
  )
}

export function AdminMenuItemIcon({
  icon: Icon,
  destructive = false,
}: {
  icon: LucideIcon
  destructive?: boolean
}) {
  return (
    <Icon
      className={`h-3.5 w-3.5 shrink-0 ${destructive ? 'text-red-500' : 'text-foreground'}`}
      strokeWidth={1.75}
    />
  )
}
