import type { ElementType } from 'react'
import {
  CreditCard,
  FileText,
  LayoutDashboard,
  PiggyBank,
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
    icon: Users,
    basePath: '/admin/members',
    children: [
      { label: 'បញ្ជីសមាជិក', href: '/admin/members' },
      { label: 'ស្នើសុំចូលរួម', href: '/admin/members/requests' },
    ],
  },
  {
    label: 'ការសន្សំ',
    icon: PiggyBank,
    basePath: '/admin/savings',
    children: [
      { label: 'បញ្ជីការសន្សំ', href: '/admin/savings' },
      { label: 'សំណើសន្សំ', href: '/admin/savings/requests' },
      { label: 'ស្នើសុំដកដើមទុន', href: '/admin/savings/capital' },
    ],
  },
  {
    label: 'កម្ជី',
    icon: CreditCard,
    basePath: '/admin/loans',
    children: [
      { label: 'បញ្ជីកម្ជី', href: '/admin/loans' },
      { label: 'ពិនិត្យពាក្យសុំ', href: '/admin/loans/requests' },
      { label: 'កម្ជីសកម្ម', href: '/admin/loans/active' },
      { label: 'បញ្ជីការសងកម្ជី', href: '/admin/loans/payments' },
    ],
  },
  {
    label: 'របាយការណ៍',
    icon: FileText,
    basePath: '/admin/reports',
    children: [
      { label: 'របាយការណ៍កម្ជី', href: '/admin/reports/loans' },
      { label: 'របាយការណ៍សន្សំ', href: '/admin/reports/savings' },
    ],
  },
]

/** First path segment under a section that is not a list/detail id */
const sectionReservedSegments: Record<string, Set<string>> = {
  '/admin/members': new Set(['requests']),
  '/admin/savings': new Set(['requests', 'capital', 'reports']),
  '/admin/loans': new Set(['requests', 'active', 'payments']),
  '/admin/reports': new Set(['loans', 'savings']),
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
  if (item.href) return pathname === item.href
  if (item.basePath && pathname.startsWith(item.basePath)) return true
  if (item.basePath === '/admin/savings' && pathname.startsWith('/admin/capital')) return true
  if (item.basePath === '/admin/loans' && pathname.startsWith('/admin/payments')) return true
  return item.children?.some((child) => isAdminChildActive(pathname, child.href)) ?? false
}

export function adminNavExpandedLabels(pathname: string) {
  return adminNav
    .filter((item) => item.children && isAdminParentActive(pathname, item))
    .map((item) => item.label)
}
