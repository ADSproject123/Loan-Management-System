'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { CreditCard, Percent } from 'lucide-react'

const TABS = [
  {
    href: '/admin/settings',
    label: 'អត្រាការប្រាក់',
    icon: Percent,
    exact: true,
  },
  {
    href: '/admin/settings/loan-plans',
    label: 'អត្រាកម្ជីជាក្រុម',
    icon: CreditCard,
    exact: false,
  },
] as const

export function SettingsTabs() {
  const pathname = usePathname()

  return (
    <nav className="flex flex-wrap gap-2">
      {TABS.map((tab) => {
        const isActive = tab.exact ? pathname === tab.href : pathname.startsWith(tab.href)
        const Icon = tab.icon

        return (
          <Link
            key={tab.href}
            href={tab.href}
            prefetch
            className={`inline-flex items-center gap-2 rounded-t-lg px-4 py-2.5 text-sm font-semibold transition-colors ${
              isActive
                ? 'border-b-2 border-brand-700 text-brand-900'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <Icon className="h-4 w-4" />
            {tab.label}
          </Link>
        )
      })}
    </nav>
  )
}
