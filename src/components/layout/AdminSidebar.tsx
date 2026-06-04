'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { BarChart3, Building2, ChevronDown, ChevronRight, LayoutDashboard } from 'lucide-react'
import {
  adminNav,
  adminNavExpandedLabels,
  isAdminChildActive,
  isAdminParentActive,
} from '@/lib/admin/nav'

export function AdminSidebar({ adminName }: { adminName: string }) {
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
    <aside className="app-sidebar fixed inset-y-0 left-0 z-40 flex h-screen w-68 flex-col text-white">
      <div className="border-b border-white/10 p-5">
        <Link
          href="/admin"
          className="flex items-center gap-3 rounded-xl transition-opacity hover:opacity-90"
        >
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/15 ring-1 ring-white/20">
            <Building2 className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-lg font-bold leading-tight">សន្សំ</p>
            <p className="text-xs font-medium text-brand-200/90">កុងសូលអ្នកគ្រប់គ្រង</p>
          </div>
        </Link>
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
              className={`flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-200 ${
                pathname === item.href ? 'app-sidebar-nav-active' : 'app-sidebar-nav-idle'
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
          <Link
            href="/dashboard"
            className="mt-3 inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-xs font-semibold text-brand-50 ring-1 ring-white/15 transition hover:bg-white/20"
          >
            <LayoutDashboard className="h-3.5 w-3.5" />
            វិបផតថលសមាជិក
          </Link>
        </div>
      </div>
    </aside>
  )
}
