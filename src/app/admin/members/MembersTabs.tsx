'use client'

import { ClipboardList, List } from 'lucide-react'
import { AdminLinkTabs } from '@/components/admin/AdminLinkTabs'

const MEMBERS_TABS = [
  { href: '/admin/members', label: 'បញ្ជីសមាជិក', icon: List, exact: true },
  { href: '/admin/members/requests', label: 'ស្នើសុំចូលរួម', icon: ClipboardList },
] as const

export function MembersTabs() {
  return (
    <AdminLinkTabs
      tabs={MEMBERS_TABS}
      ariaLabel="ផ្ទាំងសមាជិក"
      size="md"
      className="w-full sm:w-auto"
    />
  )
}
