'use client'

import { Children, useEffect, useState, type ReactNode } from 'react'
import { MoreVertical, type LucideIcon } from 'lucide-react'

export function adminMenuItemClass(destructive = false) {
  return [
    'flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-60',
    destructive ? 'text-red-500 hover:bg-red-50' : 'text-foreground hover:bg-slate-50',
  ].join(' ')
}

/** @deprecated Use adminMenuItemClass() with menuItem prop on action buttons */
export const adminActionsMenuItemClassName = adminMenuItemClass()

type AdminActionsMenuProps = {
  children: ReactNode
  align?: 'left' | 'right'
}

export function AdminActionsMenu({ children, align = 'right' }: AdminActionsMenuProps) {
  const [open, setOpen] = useState(false)
  const items = Children.toArray(children).filter(Boolean)

  useEffect(() => {
    if (!open) return

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open])

  if (items.length === 0) {
    return <span className="text-xs text-muted">—</span>
  }

  return (
    <div
      className="relative inline-flex"
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
    >
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="សកម្មភាព"
        className="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
      >
        <MoreVertical className="h-[18px] w-[18px]" strokeWidth={2} />
      </button>

      {open && (
        <button
          type="button"
          className="fixed inset-0 z-10 cursor-default"
          aria-label="បិទ"
          onClick={() => setOpen(false)}
        />
      )}
      {/* The panel stays mounted (only visually hidden) so menu items that open
          their own modal keep their state when the menu closes. */}
      <div
        role="menu"
        className={`absolute top-full z-20 mt-1.5 min-w-44 overflow-hidden rounded-lg border border-slate-200/80 bg-white py-1.5 shadow-[0_8px_30px_rgb(0_0_0_/_0.12)] ${
          align === 'right' ? 'right-0' : 'left-0'
        } ${open ? '' : 'hidden'}`}
      >
        <div className="flex flex-col px-1.5" onClick={() => setOpen(false)}>
          {items}
        </div>
      </div>
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
        className={`h-[18px] w-[18px] shrink-0 ${destructive ? 'text-red-400' : 'text-slate-400'}`}
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
      className={`h-[18px] w-[18px] shrink-0 ${destructive ? 'text-red-400' : 'text-slate-400'}`}
      strokeWidth={1.75}
    />
  )
}
