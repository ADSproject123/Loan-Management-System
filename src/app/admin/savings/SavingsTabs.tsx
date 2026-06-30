'use client'

import { Clock, Coins, List, Wallet } from 'lucide-react'
import { AdminLinkTabs } from '@/components/admin/AdminLinkTabs'

const SAVINGS_TABS = [
  { href: '/admin/savings', label: 'បញ្ជីការសន្សំ', icon: List, exact: true },
  { href: '/admin/savings/interest', label: 'បញ្ជីការប្រាក់សន្សំ', icon: Coins },
  { href: '/admin/savings/requests', label: 'សំណើសន្សំ', icon: Clock },
  { href: '/admin/savings/capital', label: 'ស្នើសុំដកដើមទុន', icon: Wallet },
] as const

export function SavingsTabs() {
  return (
    <AdminLinkTabs
      tabs={SAVINGS_TABS}
      ariaLabel="ផ្ទាំងការសន្សំ"
      size="md"
      className="w-full sm:w-auto"
    />
  )
}
