'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  BarChart3,
  Building2,
  CreditCard,
  FileText,
  LayoutDashboard,
  PiggyBank,
  Users,
  Wallet,
} from 'lucide-react'

const adminNav = [
  { label: 'ទិដ្ឋភាពទូទៅ', href: '/admin', icon: LayoutDashboard },
  { label: 'សមាជិក', href: '/admin/members', icon: Users },
  { label: 'ការបង់ប្រាក់', href: '/admin/payments', icon: PiggyBank },
  { label: 'ឥណទាន', href: '/admin/loans', icon: CreditCard },
  { label: 'ដើមទុន', href: '/admin/capital', icon: Wallet },
  { label: 'របាយការណ៍', href: '/admin/reports', icon: FileText },
]

export function AdminSidebar({ adminName }: { adminName: string }) {
  const pathname = usePathname()

  return (
    <aside className="w-64 bg-blue-900 min-h-screen flex flex-col text-white">
      <div className="p-6 border-b border-blue-800">
        <Link href="/admin" className="flex items-center gap-2 font-bold text-xl hover:text-blue-200 transition-colors">
          <Building2 className="w-7 h-7" />
          <div>
            <p>សន្សំ</p>
            <p className="text-blue-300 text-xs font-normal mt-1">កុងសូលអ្នកគ្រប់គ្រង</p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 p-4">
        {adminNav.map((item) => {
          const Icon = item.icon
          const active = pathname === item.href

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-white text-blue-900'
                  : 'bg-blue-900/50 text-blue-100 hover:bg-blue-800 hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-blue-800">
        <div className="rounded-xl bg-blue-800 p-4">
          <div className="mb-3 flex items-center gap-2 text-blue-200">
            <BarChart3 className="w-4 h-4" />
            <span className="text-xs font-semibold uppercase tracking-wide">ចូលជា</span>
          </div>
          <p className="truncate text-sm font-semibold">{adminName}</p>
          <Link
            href="/dashboard"
            className="mt-3 inline-flex rounded-lg bg-blue-900/60 px-2.5 py-1.5 text-xs font-medium text-blue-100 transition-colors hover:bg-blue-950 hover:text-white"
          >
            ត្រឡប់ទៅវិបផតថលសមាជិក
          </Link>
        </div>
      </div>
    </aside>
  )
}
