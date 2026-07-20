'use client'

import { useState } from 'react'
import { Eye } from 'lucide-react'
import { AdminSidebar } from '@/components/layout/AdminSidebar'

export function AdminShell({
  adminName,
  initialUnreadCount,
  unreadMessageCount,
  isReadOnly = false,
  children,
}: {
  adminName: string
  initialUnreadCount: number
  unreadMessageCount: number
  isReadOnly?: boolean
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
        {isReadOnly && (
          <div className="flex items-center gap-2 border-b border-amber-200 bg-amber-50 px-6 py-2 text-sm font-medium text-amber-800">
            <Eye className="h-4 w-4" />
            គណនីមើលប៉ុណ្ណោះ — អ្នកអាចមើលទិន្នន័យទាំងអស់ ប៉ុន្តែមិនអាចកែប្រែបានទេ។
          </div>
        )}
        {children}
      </main>
    </div>
  )
}
