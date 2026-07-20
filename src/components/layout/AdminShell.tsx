'use client'

import { useState } from 'react'
import { AdminSidebar } from '@/components/layout/AdminSidebar'

export function AdminShell({
  adminName,
  initialUnreadCount,
  unreadMessageCount,
  children,
}: {
  adminName: string
  initialUnreadCount: number
  unreadMessageCount: number
  children: React.ReactNode
}) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="min-h-screen">
      <AdminSidebar
        adminName={adminName}
        initialUnreadCount={initialUnreadCount}
        unreadMessageCount={unreadMessageCount}
        collapsed={collapsed}
        onCollapsedChange={setCollapsed}
      />
      <main
        className={`app-canvas min-h-screen min-w-0 overflow-auto transition-[padding] duration-200 ${
          collapsed ? 'pl-20' : 'pl-68'
        }`}
      >
        {children}
      </main>
    </div>
  )
}
