'use client'

import { useEffect, useRef, useState } from 'react'
import { Mic, Paperclip, Send, Square, FileText } from 'lucide-react'
import { formatKhmerDateTime } from '@/lib/dates'
import { showError } from '@/lib/toast'
import {
  sendAdminMessageToMember,
  sendAdminVoiceMessageToMember,
  sendAdminFileToMember,
  getNewMessagesSince,
  markConversationRead,
  type ChatMessage,
} from '@/app/actions/adminMessages'

const POLL_INTERVAL_MS = 10_000

/** Preferred recording containers, most-compatible-with-Telegram first — falls
 * back to the browser's own default if neither is supported (e.g. Safari). */
const PREFERRED_MIME_TYPES = ['audio/webm;codecs=opus', 'audio/ogg;codecs=opus']

function pickRecorderMimeType(): string | undefined {
  if (typeof MediaRecorder === 'undefined') return undefined
  return PREFERRED_MIME_TYPES.find((type) => MediaRecorder.isTypeSupported(type))
}

function extensionForMimeType(mimeType: string): string {
  if (mimeType.includes('ogg')) return 'ogg'
  if (mimeType.includes('mp4')) return 'm4a'
  return 'webm'
}

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
  const [isRecording, setIsRecording] = useState(false)
  const [recordSeconds, setRecordSeconds] = useState(0)
  const bottomRef = useRef<HTMLDivElement>(null)
  const lastSeenRef = useRef<string>(
    initialMessages.length > 0 ? initialMessages[initialMessages.length - 1].created_at : new Date(0).toISOString()
  )
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  // Release the mic and clear the elapsed-time ticker on unmount, in case a
  // recording is still in progress when the admin navigates away.
  useEffect(() => {
    return () => {
      mediaRecorderRef.current?.stream.getTracks().forEach((track) => track.stop())
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current)
    }
  }, [])

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

  const startRecording = async () => {
    if (isRecording) return
    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch {
      showError('មិនអាចប្រើមីក្រូហ្វូនបានទេ។ សូមអនុញ្ញាតការចូលប្រើមីក្រូហ្វូន។')
      return
    }

    const mimeType = pickRecorderMimeType()
    const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream)
    audioChunksRef.current = []

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) audioChunksRef.current.push(event.data)
    }
    recorder.onstop = () => {
      stream.getTracks().forEach((track) => track.stop())
    }

    mediaRecorderRef.current = recorder
    recorder.start()
    setIsRecording(true)
    setRecordSeconds(0)
    recordingTimerRef.current = setInterval(() => setRecordSeconds((s) => s + 1), 1000)
  }

  const stopRecordingAndSend = async () => {
    const recorder = mediaRecorderRef.current
    if (!recorder) return

    const finalMimeType = recorder.mimeType || 'audio/webm'
    const durationSeconds = recordSeconds

    const audioBlob: Blob = await new Promise((resolve) => {
      recorder.addEventListener('stop', () => resolve(new Blob(audioChunksRef.current, { type: finalMimeType })), {
        once: true,
      })
      recorder.stop()
    })

    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current)
    setIsRecording(false)
    mediaRecorderRef.current = null

    if (audioBlob.size === 0) return

    setSending(true)
    const formData = new FormData()
    formData.append('audio', new File([audioBlob], `voice.${extensionForMimeType(finalMimeType)}`, { type: finalMimeType }))
    formData.append('durationSeconds', String(durationSeconds))

    const result = await sendAdminVoiceMessageToMember(memberId, formData)
    setSending(false)

    if (!result.success) {
      showError(result.error)
      return
    }

    setMessages((prev) => [...prev, result.message])
    lastSeenRef.current = result.message.created_at
  }

  const handleFileSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    setSending(true)
    const formData = new FormData()
    formData.append('file', file)

    const result = await sendAdminFileToMember(memberId, formData)
    setSending(false)

    if (!result.success) {
      showError(result.error)
      return
    }

    setMessages((prev) => [...prev, result.message])
    lastSeenRef.current = result.message.created_at
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
                  {msg.message_type === 'voice' && (
                    msg.mediaSignedUrl ? (
                      <audio controls src={msg.mediaSignedUrl} className="h-9 max-w-56" />
                    ) : (
                      <p className="italic opacity-70">សំឡេងលែងអាចប្រើបានទេ</p>
                    )
                  )}
                  {msg.message_type === 'file' && (
                    msg.mediaSignedUrl ? (
                      msg.media_mime_type?.startsWith('image/') ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={msg.mediaSignedUrl}
                          alt={msg.media_filename ?? 'រូបភាព'}
                          className="max-h-56 max-w-56 rounded-lg object-cover"
                        />
                      ) : (
                        <a
                          href={msg.mediaSignedUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          download={msg.media_filename ?? undefined}
                          className={`flex items-center gap-2 rounded-lg px-2 py-1.5 underline ${
                            isAdmin ? 'hover:bg-white/10' : 'hover:bg-black/5'
                          }`}
                        >
                          <FileText className="h-4 w-4 shrink-0" />
                          <span className="truncate">{msg.media_filename ?? 'ឯកសារ'}</span>
                        </a>
                      )
                    ) : (
                      <p className="italic opacity-70">ឯកសារលែងអាចប្រើបានទេ</p>
                    )
                  )}
                  {msg.message_type === 'text' && <p className="whitespace-pre-wrap">{msg.body}</p>}
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
        {isRecording ? (
          <div className="flex h-11 flex-1 items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 text-sm text-rose-700">
            <span className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-rose-500" />
            <span>កំពុងថត... {String(Math.floor(recordSeconds / 60)).padStart(2, '0')}:{String(recordSeconds % 60).padStart(2, '0')}</span>
          </div>
        ) : (
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
        )}

        {!isRecording && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelected}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={sending}
              className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-border bg-surface text-foreground transition hover:bg-surface-muted disabled:opacity-50"
              title="ភ្ជាប់ឯកសារ"
            >
              <Paperclip className="h-4.5 w-4.5" />
            </button>
          </>
        )}

        <button
          type="button"
          onClick={isRecording ? stopRecordingAndSend : startRecording}
          disabled={sending && !isRecording}
          className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl transition disabled:opacity-50 ${
            isRecording
              ? 'bg-rose-600 text-white hover:bg-rose-700'
              : 'border border-border bg-surface text-foreground hover:bg-surface-muted'
          }`}
          title={isRecording ? 'បញ្ឈប់ និង ផ្ញើ' : 'ថតសំឡេង'}
        >
          {isRecording ? <Square className="h-4 w-4" /> : <Mic className="h-4.5 w-4.5" />}
        </button>

        {!isRecording && (
          <button
            type="button"
            onClick={handleSend}
            disabled={sending || !draft.trim()}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-900 text-white transition hover:bg-brand-950 disabled:opacity-50"
          >
            <Send className="h-4.5 w-4.5" />
          </button>
        )}
      </div>
    </div>
  )
}
