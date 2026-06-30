'use client'

import type { ElementType } from 'react'

export const adminSegmentedTabListClass =
  'flex shrink-0 items-center gap-1 overflow-x-auto rounded-xl border border-border bg-surface-muted/50 p-1'

export type AdminSegmentedTab<T extends string> = {
  id: T
  label: string
  icon?: ElementType
}

type AdminSegmentedTabsProps<T extends string> = {
  tabs: readonly AdminSegmentedTab<T>[]
  activeTab: T
  onChange: (tab: T) => void
  ariaLabel: string
  size?: 'sm' | 'md'
  className?: string
}

export function AdminSegmentedTabs<T extends string>({
  tabs,
  activeTab,
  onChange,
  ariaLabel,
  size = 'sm',
  className = '',
}: AdminSegmentedTabsProps<T>) {
  const buttonClass =
    size === 'md'
      ? 'inline-flex shrink-0 items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition'
      : 'inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition'

  const iconClass = size === 'md' ? 'h-4 w-4' : 'h-3.5 w-3.5'

  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={`${adminSegmentedTabListClass} ${className}`.trim()}
    >
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id
        const Icon = tab.icon

        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={`${buttonClass} ${
              isActive
                ? 'bg-surface text-brand-900 shadow-xs ring-1 ring-border'
                : 'text-muted hover:bg-surface/80 hover:text-foreground'
            }`}
          >
            {Icon ? (
              <Icon className={`${iconClass} ${isActive ? 'text-brand-900' : 'text-muted'}`} />
            ) : null}
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}
