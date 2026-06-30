'use client'

import { CreditCard, Percent } from 'lucide-react'
import { AdminLinkTabs } from '@/components/admin/AdminLinkTabs'

const SETTINGS_TABS = [
  { href: '/admin/settings', label: 'អត្រាការប្រាក់', icon: Percent, exact: true },
  { href: '/admin/settings/loan-plans', label: 'អត្រាកម្ជីជាក្រុម', icon: CreditCard },
] as const

export function SettingsTabs() {
  return (
    <AdminLinkTabs
      tabs={SETTINGS_TABS}
      ariaLabel="ផ្ទាំងការកំណត់"
      size="md"
      className="w-full sm:w-auto"
    />
  )
}
