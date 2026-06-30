'use client'

import { CalendarClock, ClipboardList, CreditCard, List } from 'lucide-react'
import { AdminLinkTabs } from '@/components/admin/AdminLinkTabs'

const LOANS_TABS = [
  { href: '/admin/loans', label: 'បញ្ជីកម្ជី', icon: List, exact: true },
  { href: '/admin/loans/requests', label: 'ពិនិត្យពាក្យសុំ', icon: ClipboardList },
  { href: '/admin/loans/active', label: 'កម្ជីសកម្ម', icon: CreditCard },
  { href: '/admin/loans/payments', label: 'បញ្ជីការសងកម្ជី', icon: CalendarClock },
] as const

export function LoansTabs() {
  return (
    <AdminLinkTabs
      tabs={LOANS_TABS}
      ariaLabel="ផ្ទាំងកម្ជី"
      size="md"
      className="w-full sm:w-auto"
    />
  )
}
