'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { BarChart3, ChevronDown, ChevronRight, LogOut } from 'lucide-react'
import { NotificationBell } from '@/components/layout/NotificationBell'
import {
  adminNav,
  adminNavExpandedLabels,
  isAdminChildActive,
  isAdminParentActive,
} from '@/lib/admin/nav'

export function AdminSidebar({
  adminName,
  initialUnreadCount = 0,
}: {
  adminName: string
  initialUnreadCount?: number
}) {
  const pathname = usePathname()
  const [expandedItems, setExpandedItems] = useState<string[]>(() =>
    adminNavExpandedLabels(pathname)
  )

  const toggleExpand = (label: string) => {
    setExpandedItems((prev) =>
      prev.includes(label) ? prev.filter((i) => i !== label) : [...prev, label]
    )
  }

  return (
    <aside className="app-sidebar fixed inset-y-0 left-0 z-40 flex h-screen w-68 flex-col overflow-visible text-white">
      <div className="border-b border-white/10 p-5">
        <div className="flex items-center justify-between gap-3">
          <Link
            href="/admin"
            className="min-w-0 flex-1 rounded-xl transition-opacity hover:opacity-90"
          >
            <p className="truncate text-lg font-bold leading-tight">អ្នកគ្រប់គ្រង</p>
          </Link>
          <NotificationBell initialUnreadCount={initialUnreadCount} variant="sidebar" />
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {adminNav.map((item) => {
          const Icon = item.icon
          const isActive = isAdminParentActive(pathname, item)
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
                          isAdminChildActive(pathname, child.href)
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
                isAdminParentActive(pathname, item) ? 'app-sidebar-nav-active' : 'app-sidebar-nav-idle'
              }`}
            >
              <Icon className="h-5 w-5 shrink-0 opacity-90" />
              <span className="truncate">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-white/10 p-4">
        <div className="rounded-2xl bg-white/10 p-4 ring-1 ring-white/10 backdrop-blur-sm">
          <div className="mb-2 flex items-center gap-2 text-brand-100/90">
            <BarChart3 className="h-4 w-4" />
            <span className="text-[10px] font-bold uppercase tracking-wider">ចូលជា</span>
          </div>
          <p className="truncate text-sm font-semibold text-white">{adminName}</p>
          <div className="mt-3">
            <form action="/api/auth/signout" method="post">
              <button
                type="submit"
                title="ចាកចេញ"
                className="inline-flex cursor-pointer items-center justify-center rounded-xl bg-white/10 p-2 text-brand-50 ring-1 ring-white/15 transition hover:bg-rose-500/30 hover:text-rose-200"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </aside>
  )
}
