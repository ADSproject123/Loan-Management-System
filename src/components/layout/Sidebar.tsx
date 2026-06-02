'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  PiggyBank,
  CreditCard,
  Wallet,
  ShieldCheck,
  ChevronDown,
  ChevronRight,
  Building2,
  LogOut,
  Bell,
} from 'lucide-react'

interface NavItem {
  label: string
  href?: string
  icon: React.ElementType
  children?: { label: string; href: string }[]
}

const navItems: NavItem[] = [
  {
    label: 'ផ្ទាំងគ្រប់គ្រង',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'ការសន្សំ',
    icon: PiggyBank,
    children: [
      { label: 'ទិដ្ឋភាពទូទៅ', href: '/dashboard/savings' },
      { label: 'ស្នើសុំការសន្សំ', href: '/dashboard/savings/add' },
      { label: 'របាយការណ៍សន្សំ', href: '/dashboard/savings/report' },
    ],
  },
  {
    label: 'កម្ជី',
    icon: CreditCard,
    children: [
      { label: 'ទិដ្ឋភាពទូទៅ', href: '/dashboard/loans' },
      { label: 'ស្នើសុំកម្ជី', href: '/dashboard/loans/request' },
      { label: 'សងកម្ជី', href: '/dashboard/loans/repay' },
      { label: 'របាយការណ៍កម្ជី', href: '/dashboard/loans/report' },
    ],
  },
  {
    label: 'ស្នើសុំដើមទុន',
    href: '/dashboard/capital',
    icon: Wallet,
  },
]

interface SidebarProps {
  memberName?: string
  isAdmin?: boolean
}

export function Sidebar({ memberName = 'សមាជិក', isAdmin = false }: SidebarProps) {
  const pathname = usePathname()
  const [expandedItems, setExpandedItems] = useState<string[]>(['ការសន្សំ', 'កម្ជី'])
  const items: NavItem[] = isAdmin
    ? [
        ...navItems,
        {
          label: 'អ្នកគ្រប់គ្រង',
          href: '/admin',
          icon: ShieldCheck,
        },
      ]
    : navItems

  const toggleExpand = (label: string) => {
    setExpandedItems((prev) =>
      prev.includes(label) ? prev.filter((i) => i !== label) : [...prev, label]
    )
  }

  const isActiveParent = (item: NavItem) => {
    if (item.href) return pathname === item.href
    return item.children?.some((child) => pathname === child.href) ?? false
  }

  return (
    <aside className="w-64 bg-blue-900 min-h-screen flex flex-col text-white">
      {/* Logo */}
      <div className="p-6 border-b border-blue-800">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl hover:text-blue-200 transition-colors">
          <Building2 className="w-7 h-7" />
          <span>សន្សំ</span>
        </Link>
        <p className="text-blue-300 text-xs mt-1 truncate">{memberName}</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {items.map((item) => {
          const Icon = item.icon
          const isActive = isActiveParent(item)
          const isExpanded = expandedItems.includes(item.label)

          if (item.children) {
            return (
              <div key={item.label}>
                <button
                  onClick={() => toggleExpand(item.label)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive ? 'bg-blue-800 text-white' : 'bg-blue-900/50 text-blue-100 hover:bg-blue-800 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    {item.label}
                  </div>
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </button>
                {isExpanded && (
                  <div className="mt-1 ml-4 space-y-1 pl-4 border-l border-blue-700">
                    {item.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                          pathname === child.href
                            ? 'bg-white text-blue-900 font-medium'
                            : 'bg-blue-900/30 text-blue-200 hover:bg-blue-800 hover:text-white'
                        }`}
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )
          }

          return (
            <Link
              key={item.href}
              href={item.href!}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive ? 'bg-white text-blue-900' : 'bg-blue-900/50 text-blue-100 hover:bg-blue-800 hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Footer actions */}
      <div className="p-4 border-t border-blue-800 space-y-1">
        <Link
          href="/dashboard/notifications"
          className="flex items-center gap-3 rounded-lg bg-blue-900/50 px-3 py-2.5 text-sm font-medium text-blue-100 transition-colors hover:bg-blue-800 hover:text-white"
        >
          <Bell className="w-5 h-5" />
          ការជូនដំណឹង
        </Link>
        <form action="/api/auth/signout" method="POST">
          <button
            type="submit"
            className="w-full flex items-center gap-3 rounded-lg bg-blue-900/50 px-3 py-2.5 text-sm font-medium text-blue-100 transition-colors hover:bg-blue-800 hover:text-white"
          >
            <LogOut className="w-5 h-5" />
            ចាកចេញ
          </button>
        </form>
      </div>
    </aside>
  )
}
