'use client'

import { useCallback, useEffect, useRef, useState, useTransition } from 'react'
import { Bell, CheckCircle, Clock, Loader2 } from 'lucide-react'
import {
  getMemberNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type MemberNotification,
} from '@/app/actions/notifications'
import { formatKhmerDateTime } from '@/lib/dates'

type NotificationBellProps = {
  initialUnreadCount?: number
  variant?: 'default' | 'sidebar'
}

export function NotificationBell({
  initialUnreadCount = 0,
  variant = 'default',
}: NotificationBellProps) {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<MemberNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount)
  const [loaded, setLoaded] = useState(false)
  const [loading, setLoading] = useState(false)
  const [pending, startTransition] = useTransition()
  const containerRef = useRef<HTMLDivElement>(null)

  const loadNotifications = useCallback(async () => {
    setLoading(true)
    try {
      const rows = await getMemberNotifications()
      setNotifications(rows)
      setUnreadCount(rows.filter((row) => !row.read).length)
      setLoaded(true)
    } finally {
      setLoading(false)
    }
  }, [])

  const toggleOpen = () => {
    const nextOpen = !open
    setOpen(nextOpen)
    if (nextOpen && !loaded && !loading) {
      void loadNotifications()
    }
  }

  useEffect(() => {
    setUnreadCount(initialUnreadCount)
  }, [initialUnreadCount])

  useEffect(() => {
    if (!open) return

    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  const handleMarkAllRead = () => {
    startTransition(async () => {
      const result = await markAllNotificationsRead()
      if (!result.success) return
      setNotifications((prev) => prev.map((row) => ({ ...row, read: true })))
      setUnreadCount(0)
    })
  }

  const handleMarkRead = (notificationId: string) => {
    startTransition(async () => {
      const result = await markNotificationRead(notificationId)
      if (!result.success) return
      setNotifications((prev) =>
        prev.map((row) => (row.id === notificationId ? { ...row, read: true } : row))
      )
      setUnreadCount((count) => Math.max(0, count - 1))
    })
  }

  const isSidebar = variant === 'sidebar'

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={toggleOpen}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label="ការជូនដំណឹង"
        className={
          isSidebar
            ? 'relative inline-flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-xl bg-white/15 text-white ring-1 ring-white/20 transition hover:bg-white/25'
            : 'relative grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-slate-200/80 bg-white shadow-sm transition hover:border-brand-200 hover:shadow'
        }
      >
        <Bell className={isSidebar ? 'h-5 w-5' : 'h-5 w-5 text-slate-600'} />
        {unreadCount > 0 && (
          <span
            className={`absolute flex items-center justify-center rounded-full bg-red-500 font-bold text-white ${
              isSidebar
                ? '-right-1 -top-1 min-h-5 min-w-5 px-1 text-[10px] ring-2 ring-brand-950'
                : 'right-2 top-2 h-2.5 w-2.5 ring-2 ring-white'
            }`}
          >
            {isSidebar && unreadCount > 9 ? '9+' : isSidebar ? unreadCount : null}
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="ការជូនដំណឹង"
          className={`absolute z-100 w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl ${
            isSidebar ? 'left-full top-0 ml-3' : 'right-0 mt-2'
          }`}
        >
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-slate-900">ការជូនដំណឹង</p>
              {unreadCount > 0 && (
                <p className="text-xs text-slate-500">{unreadCount} មិនទាន់អាន</p>
              )}
            </div>
            {notifications.some((row) => !row.read) && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                disabled={pending}
                className="rounded-lg bg-brand-50 px-2.5 py-1.5 text-xs font-medium text-brand-700 transition hover:bg-brand-100 disabled:opacity-60"
              >
                អានទាំងអស់
              </button>
            )}
          </div>

          <div className="max-h-[min(28rem,70vh)] overflow-y-auto">
            {loading && (
              <div className="flex items-center justify-center gap-2 px-4 py-10 text-sm text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                កំពុងផ្ទុក...
              </div>
            )}

            {!loading && loaded && notifications.length === 0 && (
              <p className="px-4 py-10 text-center text-sm text-slate-500">
                មិនទាន់មានការជូនដំណឹងនៅឡើយ។
              </p>
            )}

            {!loading &&
              notifications.map((notif) => (
                <button
                  key={notif.id}
                  type="button"
                  onClick={() => {
                    if (!notif.read) handleMarkRead(notif.id)
                  }}
                  className={`flex w-full items-start gap-3 border-b border-slate-100 px-4 py-3 text-left transition last:border-b-0 ${
                    notif.read ? 'bg-white hover:bg-slate-50' : 'bg-brand-50/70 hover:bg-brand-50'
                  }`}
                >
                  <span
                    className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full ${
                      notif.read ? 'bg-slate-100' : 'bg-brand-100'
                    }`}
                  >
                    {notif.read ? (
                      <CheckCircle className="h-4 w-4 text-slate-400" />
                    ) : (
                      <Bell className="h-4 w-4 text-brand-700" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-start justify-between gap-2">
                      <span
                        className={`text-sm font-medium ${
                          notif.read ? 'text-slate-700' : 'text-brand-900'
                        }`}
                      >
                        {notif.title}
                      </span>
                      <span className="flex shrink-0 items-center gap-1 text-slate-400">
                        <Clock className="h-3 w-3" />
                        <span className="text-xs">
                          {formatKhmerDateTime(notif.created_at) ?? '—'}
                        </span>
                      </span>
                    </span>
                    <span
                      className={`mt-1 block text-sm leading-relaxed ${
                        notif.read ? 'text-slate-500' : 'text-brand-700'
                      }`}
                    >
                      {notif.message}
                    </span>
                  </span>
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}
