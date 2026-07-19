'use client'

import { useEffect, useRef, useState } from 'react'
import { Send } from 'lucide-react'
import { formatKhmerDateTime } from '@/lib/dates'
import { showError } from '@/lib/toast'
import {
  sendAdminMessageToMember,
  getNewMessagesSince,
  markConversationRead,
  type ChatMessage,
} from '@/app/actions/adminMessages'

const POLL_INTERVAL_MS = 10_000

export function ConversationThread({
  memberId,
  memberName,
  hasTelegram,
  initialMessages,
}: {
  memberId: string
  memberName: string
  hasTelegram: boolean
  initialMessages: ChatMessage[]
}) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages)
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const lastSeenRef = useRef<string>(
    initialMessages.length > 0 ? initialMessages[initialMessages.length - 1].created_at : new Date(0).toISOString()
  )

  useEffect(() => {
    markConversationRead(memberId)
  }, [memberId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' })
  }, [messages.length])

  useEffect(() => {
    const interval = setInterval(async () => {
      const fresh = await getNewMessagesSince(memberId, lastSeenRef.current)
      if (fresh.length === 0) return

      setMessages((prev) => {
        const existingIds = new Set(prev.map((m) => m.id))
        const toAdd = fresh.filter((m) => !existingIds.has(m.id))
        return toAdd.length > 0 ? [...prev, ...toAdd] : prev
      })
      lastSeenRef.current = fresh[fresh.length - 1].created_at
      markConversationRead(memberId)
    }, POLL_INTERVAL_MS)

    return () => clearInterval(interval)
  }, [memberId])

  const handleSend = async () => {
    const trimmed = draft.trim()
    if (!trimmed || sending) return

    setSending(true)
    const result = await sendAdminMessageToMember(memberId, trimmed)
    setSending(false)

    if (!result.success) {
      showError(result.error)
      return
    }

    setMessages((prev) => [...prev, result.message])
    lastSeenRef.current = result.message.created_at
    setDraft('')
  }

  return (
    <div className="flex flex-1 flex-col min-h-0">
      {!hasTelegram && (
        <div className="border-b border-amber-200 bg-amber-50 px-6 py-2.5 text-xs text-amber-800 md:px-8">
          {memberName} មិនទាន់ភ្ជាប់ Telegram ទេ — សារនឹងមិនអាចផ្ញើបានទេ រហូតដល់ពួកគេភ្ជាប់។
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-6 py-6 md:px-8">
        {messages.length === 0 && (
          <p className="text-center text-sm text-muted">មិនទាន់មានសារទេ។ ចាប់ផ្តើមសន្ទនាខាងក្រោម។</p>
        )}
        <ul className="space-y-3">
          {messages.map((msg) => {
            const isAdmin = msg.sender_type === 'admin'
            return (
              <li key={msg.id} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    isAdmin
                      ? 'bg-brand-900 text-white'
                      : 'border border-border bg-surface-muted text-foreground'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.body}</p>
                  <p className={`mt-1 text-[10px] ${isAdmin ? 'text-white/70' : 'text-muted'}`}>
                    {formatKhmerDateTime(msg.created_at)}
                  </p>
                </div>
              </li>
            )
          })}
        </ul>
        <div ref={bottomRef} />
      </div>

      <div className="flex items-end gap-3 border-t border-border px-6 py-4 md:px-8">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleSend()
            }
          }}
          rows={1}
          placeholder="វាយសារ..."
          className="app-field min-h-11 flex-1 resize-none rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground outline-none focus:border-border"
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={sending || !draft.trim()}
          className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-900 text-white transition hover:bg-brand-950 disabled:opacity-50"
        >
          <Send className="h-4.5 w-4.5" />
        </button>
      </div>
    </div>
  )
}
