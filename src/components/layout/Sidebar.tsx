'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  PiggyBank,
  CreditCard,
  ChevronDown,
  ChevronRight,
  Building2,
  LogOut,
  Send,
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
      { label: 'ស្នើសុំដើមទុន', href: '/dashboard/capital' },
    ],
  },
  {
    label: 'កម្ជី',
    icon: CreditCard,
    children: [
      { label: 'ទិដ្ឋភាពទូទៅ', href: '/dashboard/loans' },
      { label: 'ស្នើសុំកម្ជី', href: '/dashboard/loans/request' },
      { label: 'សងកម្ជី', href: '/dashboard/loans/repay' },
    ],
  },
]

interface SidebarProps {
  memberName?: string
  telegramLinked?: boolean
}

export function Sidebar({ memberName = 'សមាជិក', telegramLinked = true }: SidebarProps) {
  const pathname = usePathname()
  const [expandedItems, setExpandedItems] = useState<string[]>(['ការសន្សំ', 'កម្ជី'])
  const items = navItems

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
    <aside className="app-sidebar fixed inset-y-0 left-0 z-40 flex h-screen w-68 flex-col text-white">
      <div className="border-b border-white/10 p-5">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-xl transition-opacity hover:opacity-90"
        >
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/15 ring-1 ring-white/20">
            <Building2 className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-lg font-bold leading-tight">សន្សំ</p>
            <p className="truncate text-xs font-medium text-brand-200/90">{memberName}</p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {items.map((item) => {
          const Icon = item.icon
          const isActive = isActiveParent(item)
          const isExpanded = expandedItems.includes(item.label)

          if (item.children) {
            return (
              <div key={item.label}>
                <button
                  type="button"
                  onClick={() => toggleExpand(item.label)}
                  className={`flex w-full cursor-pointer items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-200 ${
                    isActive ? 'app-sidebar-nav-active' : 'app-sidebar-nav-idle'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-5 w-5 shrink-0 opacity-90" />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 shrink-0 opacity-70" />
                  ) : (
                    <ChevronRight className="h-4 w-4 shrink-0 opacity-70" />
                  )}
                </button>
                {isExpanded && (
                  <div className="mt-1 space-y-0.5 border-l border-white/15 py-1 pl-3 ml-5">
                    {item.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        prefetch
                        className={`block cursor-pointer rounded-lg px-3 py-2 text-sm transition-colors duration-200 ${
                          pathname === child.href
                            ? 'app-sidebar-nav-child-active'
                            : 'app-sidebar-nav-idle'
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
              prefetch
              className={`flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-200 ${
                isActive ? 'app-sidebar-nav-active' : 'app-sidebar-nav-idle'
              }`}
            >
              <Icon className="h-5 w-5 shrink-0 opacity-90" />
              <span className="truncate">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="space-y-1 border-t border-white/10 p-3">
        {!telegramLinked && (
          <Link
            href="/dashboard/telegram"
            prefetch
            className="app-sidebar-nav-idle flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-200"
          >
            <Send className="h-5 w-5 shrink-0" />
            <span className="truncate">ភ្ជាប់ Telegram</span>
            <span className="ml-auto h-2 w-2 rounded-full bg-amber-300" />
          </Link>
        )}
        <form action="/api/auth/signout" method="POST">
          <button
            type="submit"
            className="app-sidebar-nav-idle flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-200"
          >
            <LogOut className="h-5 w-5 shrink-0" />
            ចាកចេញ
          </button>
        </form>
      </div>
    </aside>
  )
}
