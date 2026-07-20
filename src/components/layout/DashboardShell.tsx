'use client'

import { useState } from 'react'
import { Sidebar } from '@/components/layout/Sidebar'
import { NotificationBell } from '@/components/layout/NotificationBell'
import { TelegramConnectBanner } from '@/components/telegram/TelegramConnectBanner'

export function DashboardShell({
  memberName,
  telegramLinked,
  unreadCount,
  children,
}: {
  memberName: string
  telegramLinked: boolean
  unreadCount: number
  children: React.ReactNode
}) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="min-h-screen">
      <Sidebar
        memberName={memberName}
        telegramLinked={telegramLinked}
        collapsed={collapsed}
        onCollapsedChange={setCollapsed}
      />
      <div
        className={`flex min-h-screen min-w-0 flex-col transition-[padding] duration-200 ${
          collapsed ? 'pl-20' : 'pl-68'
        }`}
      >
        <header className="sticky top-0 z-30 flex items-center justify-end border-b border-slate-200/80 bg-white/90 px-6 py-3 backdrop-blur-md md:px-10">
          <NotificationBell initialUnreadCount={unreadCount} />
        </header>
        {!telegramLinked && <TelegramConnectBanner />}
        <main className="app-canvas min-h-0 flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  )
}
