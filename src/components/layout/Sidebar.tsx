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
  ChevronLeft,
  Building2,
  LogOut,
  Send,
  User,
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
  {
    label: 'ព័ត៌មានផ្ទាល់ខ្លួន',
    href: '/dashboard/profile',
    icon: User,
  },
]

interface SidebarProps {
  memberName?: string
  telegramLinked?: boolean
  collapsed?: boolean
  onCollapsedChange?: (collapsed: boolean) => void
}

export function Sidebar({
  memberName = 'សមាជិក',
  telegramLinked = true,
  collapsed = false,
  onCollapsedChange,
}: SidebarProps) {
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

  const handleCollapsedGroupClick = (label: string) => {
    // A collapsed sidebar hides sub-items entirely, so clicking a group's
    // icon expands the sidebar back and opens that group at the same time,
    // rather than toggling a submenu nobody can see.
    onCollapsedChange?.(false)
    if (!expandedItems.includes(label)) {
      setExpandedItems((prev) => [...prev, label])
    }
  }

  return (
    <aside
      className={`app-sidebar fixed inset-y-0 left-0 z-40 flex h-screen flex-col text-white transition-[width] duration-200 ${
        collapsed ? 'w-20' : 'w-68'
      }`}
    >
      {onCollapsedChange && (
        <button
          type="button"
          onClick={() => onCollapsedChange(!collapsed)}
          title={collapsed ? 'បើកម៉ឺនុយ' : 'បិទម៉ឺនុយ'}
          aria-label={collapsed ? 'បើកម៉ឺនុយ' : 'បិទម៉ឺនុយ'}
          className="absolute -right-3 top-6 z-50 grid h-6 w-6 place-items-center rounded-full bg-white text-brand-950 shadow-md ring-1 ring-black/10 transition hover:bg-brand-50"
        >
          {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
        </button>
      )}

      <div className="border-b border-white/10 p-5">
        <Link
          href="/"
          className={`flex items-center gap-3 rounded-xl transition-opacity hover:opacity-90 ${
            collapsed ? 'justify-center' : ''
          }`}
        >
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/15 ring-1 ring-white/20">
            <Building2 className="h-5 w-5" />
          </span>
          {!collapsed && (
            <div className="min-w-0">
              <p className="font-heading truncate text-lg font-bold leading-tight">សន្សំ</p>
              <p className="truncate text-xs font-medium text-brand-200/90">{memberName}</p>
            </div>
          )}
        </Link>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto overflow-x-hidden p-3">
        {items.map((item) => {
          const Icon = item.icon
          const isActive = isActiveParent(item)
          const isExpanded = expandedItems.includes(item.label)

          if (item.children) {
            return (
              <div key={item.label}>
                <button
                  type="button"
                  onClick={() => (collapsed ? handleCollapsedGroupClick(item.label) : toggleExpand(item.label))}
                  title={item.label}
                  className={`flex w-full cursor-pointer items-center rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-200 ${
                    collapsed ? 'justify-center' : 'justify-between'
                  } ${isActive ? 'app-sidebar-nav-active' : 'app-sidebar-nav-idle'}`}
                >
                  <div className={`flex items-center gap-3 ${collapsed ? '' : 'min-w-0'}`}>
                    <Icon className="h-5 w-5 shrink-0 opacity-90" />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </div>
                  {!collapsed && (
                    isExpanded ? (
                      <ChevronDown className="h-4 w-4 shrink-0 opacity-70" />
                    ) : (
                      <ChevronRight className="h-4 w-4 shrink-0 opacity-70" />
                    )
                  )}
                </button>
                {!collapsed && isExpanded && (
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
              title={item.label}
              className={`flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-200 ${
                collapsed ? 'justify-center' : ''
              } ${isActive ? 'app-sidebar-nav-active' : 'app-sidebar-nav-idle'}`}
            >
              <Icon className="h-5 w-5 shrink-0 opacity-90" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      <div className="space-y-1 border-t border-white/10 p-3">
        {!telegramLinked && (
          <Link
            href="/dashboard/telegram"
            prefetch
            title="ភ្ជាប់ Telegram"
            className={`app-sidebar-nav-idle relative flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-200 ${
              collapsed ? 'justify-center' : ''
            }`}
          >
            <Send className="h-5 w-5 shrink-0" />
            {!collapsed && (
              <>
                <span className="truncate">ភ្ជាប់ Telegram</span>
                <span className="ml-auto h-2 w-2 rounded-full bg-amber-300" />
              </>
            )}
            {collapsed && <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-amber-300" />}
          </Link>
        )}
        <form action="/api/auth/signout" method="POST">
          <button
            type="submit"
            title="ចាកចេញ"
            className={`app-sidebar-nav-idle flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-200 ${
              collapsed ? 'justify-center' : ''
            }`}
          >
            <LogOut className="h-5 w-5 shrink-0" />
            {!collapsed && 'ចាកចេញ'}
          </button>
        </form>
      </div>
    </aside>
  )
}
