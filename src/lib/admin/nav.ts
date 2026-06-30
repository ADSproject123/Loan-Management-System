import type { ElementType } from 'react'
import {
  CreditCard,

  LayoutDashboard,
  PiggyBank,
  Settings,
  Users,
} from 'lucide-react'

export type AdminNavChild = {
  label: string
  href: string
}

export type AdminNavItem = {
  label: string
  href?: string
  icon: ElementType
  basePath?: string
  children?: AdminNavChild[]
}

/** Sidebar + in-section tab navigation */
export const adminNav: AdminNavItem[] = [
  { label: 'ផ្ទាំងគ្រប់គ្រង', href: '/admin', icon: LayoutDashboard },
  {
    label: 'សមាជិក',
    href: '/admin/members',
    icon: Users,
  },
  {
    label: 'ការសន្សំ',
    href: '/admin/savings',
    icon: PiggyBank,
  },
  {
    label: 'កម្ជី',
    href: '/admin/loans',
    icon: CreditCard,
  },

  { label: 'ការកំណត់', href: '/admin/settings', icon: Settings },
]

/** First path segment under a section that is not a list/detail id */
const sectionReservedSegments: Record<string, Set<string>> = {
  '/admin/members': new Set(['requests']),
  '/admin/savings': new Set(['requests', 'capital', 'interest']),
  '/admin/loans': new Set(['requests', 'active', 'payments']),
}

export function getAdminSectionByPath(pathname: string): AdminNavItem | undefined {
  return adminNav.find(
    (item) => item.basePath && (pathname === item.basePath || pathname.startsWith(`${item.basePath}/`))
  )
}

export function isAdminChildActive(pathname: string, href: string) {
  if (pathname === href) return true

  const section = Object.keys(sectionReservedSegments).find((base) => href === base)
  if (!section || !pathname.startsWith(`${section}/`)) return false

  const rest = pathname.slice(section.length + 1)
  const firstSegment = rest.split('/')[0]
  const reserved = sectionReservedSegments[section]
  if (reserved.has(firstSegment)) return false

  return href === section
}

export function isAdminParentActive(pathname: string, item: AdminNavItem) {
  if (item.href) {
    if (pathname === item.href) return true
    if (item.href === '/admin/settings' && pathname.startsWith('/admin/settings/')) return true
    if (item.href === '/admin/savings' && pathname.startsWith('/admin/savings/')) return true
    if (item.href === '/admin/loans' && pathname.startsWith('/admin/loans')) return true
    if (item.href === '/admin/members' && pathname.startsWith('/admin/members')) return true
    return false
  }
  if (item.basePath && pathname.startsWith(item.basePath)) return true
  if (item.basePath === '/admin/savings' && pathname.startsWith('/admin/capital')) return true
  return item.children?.some((child) => isAdminChildActive(pathname, child.href)) ?? false
}

export function adminNavExpandedLabels(pathname: string) {
  return adminNav
    .filter((item) => item.children && isAdminParentActive(pathname, item))
    .map((item) => item.label)
}
