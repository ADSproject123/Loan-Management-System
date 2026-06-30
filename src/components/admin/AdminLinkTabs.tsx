'use client'

import Link, { useLinkStatus } from 'next/link'
import { usePathname } from 'next/navigation'
import type { ElementType } from 'react'
import { LoadingSpinner } from '@/components/ui/Loading'
import { adminSegmentedTabListClass } from '@/components/admin/AdminSegmentedTabs'

export type AdminLinkTab = {
  href: string
  label: string
  icon?: ElementType
  exact?: boolean
}

type AdminLinkTabsProps = {
  tabs: readonly AdminLinkTab[]
  ariaLabel: string
  size?: 'sm' | 'md'
  className?: string
}

function TabLinkIcon({
  icon: Icon,
  iconClass,
  isActive,
}: {
  icon: ElementType
  iconClass: string
  isActive: boolean
}) {
  const { pending } = useLinkStatus()

  if (pending) {
    return <LoadingSpinner size="sm" color="brand" className={iconClass} />
  }

  return <Icon className={`${iconClass} ${isActive ? 'text-brand-900' : 'text-muted'}`} />
}

export function AdminLinkTabs({
  tabs,
  ariaLabel,
  size = 'md',
  className = '',
}: AdminLinkTabsProps) {
  const pathname = usePathname()

  const linkClass =
    size === 'md'
      ? 'inline-flex shrink-0 items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition'
      : 'inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition'

  const iconClass = size === 'md' ? 'h-4 w-4' : 'h-3.5 w-3.5'

  return (
    <nav
      role="tablist"
      aria-label={ariaLabel}
      className={`${adminSegmentedTabListClass} ${className}`.trim()}
    >
      {tabs.map((tab) => {
        const isActive = tab.exact ? pathname === tab.href : pathname.startsWith(tab.href)
        const Icon = tab.icon

        return (
          <Link
            key={tab.href}
            href={tab.href}
            prefetch
            role="tab"
            aria-selected={isActive}
            className={`${linkClass} ${
              isActive
                ? 'bg-surface text-brand-900 shadow-xs ring-1 ring-border'
                : 'text-muted hover:bg-surface/80 hover:text-foreground'
            }`}
          >
            {Icon ? <TabLinkIcon icon={Icon} iconClass={iconClass} isActive={isActive} /> : null}
            {tab.label}
          </Link>
        )
      })}
    </nav>
  )
}
