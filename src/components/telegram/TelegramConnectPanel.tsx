'use client'

import { useEffect, useState } from 'react'
import { ArrowRight, CheckCircle2, Copy, Send } from 'lucide-react'
import { checkTelegramConnected } from '@/app/actions/member'
import { buildTelegramDeepLink } from '@/lib/telegramConnect'
import { LoadingDots, LoadingSpinner } from '@/components/ui/Loading'

type TelegramConnectPanelProps = {
  connectToken: string | null
  title?: string
  description?: string
  required?: boolean
  onConnected?: () => void
  onContinue?: () => void
  showCopyLink?: boolean
}

export function TelegramConnectPanel({
  connectToken,
  title = 'ភ្ជាប់តេលេក្រាម',
  description = 'ចុចតំណខាងក្រោម បើក Telegram ហើយចុច Start។ ប្រព័ន្ធនឹងភ្ជាប់គណនីរបស់អ្នកដោយស្វ័យប្រវត្តិ។',
  required = false,
  onConnected,
  onContinue,
  showCopyLink = false,
}: TelegramConnectPanelProps) {
  const [connected, setConnected] = useState(false)
  const [checking, setChecking] = useState(Boolean(connectToken))
  const [copied, setCopied] = useState(false)
  const deepLink = buildTelegramDeepLink(connectToken)

  useEffect(() => {
    if (!connectToken) {
      setChecking(false)
      return
    }

    let active = true

    checkTelegramConnected(connectToken)
      .then((isConnected) => {
        if (!active) return
        if (isConnected) {
          setConnected(true)
          onConnected?.()
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active) setChecking(false)
      })

    const interval = setInterval(async () => {
      try {
        const isConnected = await checkTelegramConnected(connectToken)
        if (active && isConnected) {
          setConnected(true)
          onConnected?.()
          clearInterval(interval)
        }
      } catch {
        // keep polling
      }
    }, 3000)

    return () => {
      active = false
      clearInterval(interval)
    }
  }, [connectToken, onConnected])

  async function handleCopy() {
    if (!deepLink) return
    try {
      await navigator.clipboard.writeText(deepLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // ignore
    }
  }

  if (checking) {
    return (
      <div className="flex items-center justify-center py-10">
        <LoadingSpinner size="md" color="brand" />
      </div>
    )
  }

  if (connected) {
    return (
      <div className="py-4 text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-100 ring-8 ring-emerald-50">
          <CheckCircle2 className="h-8 w-8 text-emerald-600" />
        </div>
        <h3 className="mt-4 text-lg font-bold text-slate-950">តេលេក្រាមត្រូវបានភ្ជាប់</h3>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
          អ្នកនឹងទទួលការជូនដំណឹងតាម Telegram នៅពេលមានអ្វីថ្មីលើគណនីរបស់អ្នក។
        </p>
        {onContinue && (
          <button
            type="button"
            onClick={onContinue}
            className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-brand-950 px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-900"
          >
            បន្ត
            <ArrowRight className="h-4 w-4" />
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 rounded-2xl border border-sky-100 bg-sky-50/70 p-4">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-sky-600 ring-1 ring-sky-100">
          <Send className="h-4 w-4" />
        </span>
        <div>
          <p className="text-sm font-semibold text-slate-900">{title}</p>
          <p className="mt-1 text-[13px] leading-6 text-slate-600">{description}</p>
        </div>
      </div>

      {deepLink ? (
        <>
          <a
            href={deepLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#229ED9] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1c8dc2]"
          >
            <Send className="h-4 w-4" />
            បើក Telegram និង ភ្ជាប់
            <ArrowRight className="h-4 w-4" />
          </a>

          {showCopyLink && (
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <Copy className="h-4 w-4" />
              {copied ? 'បានចម្លងតំណភ្ជាប់' : 'ចម្លងតំណភ្ជាប់ឱ្យសមាជិក'}
            </button>
          )}

          <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
            <LoadingDots size="sm" color="brand" />
            កំពុងរង់ចាំការភ្ជាប់...
          </div>

          {required && (
            <p className="text-center text-xs text-slate-400">
              ការភ្ជាប់តេលេក្រាមត្រូវបានទាមទារដើម្បីបញ្ចប់ការចុះឈ្មោះ។
            </p>
          )}
        </>
      ) : (
        <div className="rounded-xl border border-amber-200 bg-amber-50/70 px-4 py-3 text-[13px] leading-6 text-amber-800">
          Telegram មិនទាន់ត្រូវបានកំណត់រចនាសម្ព័ន្ធនៅឡើយទេ។ សូមទាក់ទងអ្នកគ្រប់គ្រង។
        </div>
      )}
    </div>
  )
}
