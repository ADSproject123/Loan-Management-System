'use client'

import { Copy } from 'lucide-react'
import { useState } from 'react'
import { TelegramConnectPanel } from '@/components/telegram/TelegramConnectPanel'
import { TelegramConnectSteps } from '@/components/telegram/TelegramConnectBanner'
import { buildTelegramDeepLink } from '@/lib/telegramConnect'

export function AdminMemberTelegramLink({
  memberName,
  linked,
  connectToken,
}: {
  memberName: string
  linked: boolean
  connectToken: string | null
}) {
  const [copied, setCopied] = useState(false)
  const deepLink = buildTelegramDeepLink(connectToken)

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

  if (linked) {
    return <span className="text-sm text-emerald-700">បានភ្ជាប់</span>
  }

  if (!deepLink) {
    return <span className="text-sm text-muted">មិនបានភ្ជាប់</span>
  }

  return (
    <div className="space-y-2">
      <p className="text-sm text-foreground">មិនបានភ្ជាប់</p>
      <p className="text-xs leading-5 text-muted">
        ផ្ញើតំណនេះឱ្យ <strong>{memberName}</strong> ដើម្បីភ្ជាប់ Telegram របស់គាត់។
      </p>
      <button
        type="button"
        onClick={handleCopy}
        className="inline-flex items-center gap-2 rounded-lg border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-800 transition hover:bg-brand-100"
      >
        <Copy className="h-3.5 w-3.5" />
        {copied ? 'បានចម្លងតំណ' : 'ចម្លងតំណភ្ជាប់ Telegram'}
      </button>
    </div>
  )
}

export function AdminMemberTelegramConnectCard({
  connectToken,
  memberName,
  memberPhone,
}: {
  connectToken: string
  memberName: string
  memberPhone?: string
}) {
  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-sky-100 bg-sky-50/40 p-5">
        <p className="text-base font-bold text-slate-900">ជំហានបន្ទាប់ — ភ្ជាប់ Telegram</p>
        <p className="mt-1 text-sm leading-6 text-slate-600">
          គណនី <strong>{memberName}</strong> ត្រូវបានបង្កើតរួចហើយ។ ផ្ញើតំណភ្ជាប់ផ្ទាល់ខ្លួនខាងក្រោមឱ្យសមាជិក ឬ ឱ្យគាត់ចូលគណនីហើយទៅ <strong>ភ្ជាប់ Telegram</strong>។
        </p>
        {memberPhone && (
          <p className="mt-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700">
            លេខចូលគណនី៖ <strong>{memberPhone}</strong>
          </p>
        )}
        <div className="mt-4">
          <TelegramConnectSteps />
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <p className="mb-4 text-sm font-semibold text-slate-900">តំណភ្ជាប់ផ្ទាល់ខ្លួនសម្រាប់ {memberName}</p>
        <TelegramConnectPanel
          connectToken={connectToken}
          showCopyLink
          description="តំណនេះតែមួយគត់ភ្ជាប់គណនីសមាជិកនេះទៅ Telegram។ សមាជិកត្រូវបើកតំណនេះ ហើយចុច Start។"
        />
      </div>
    </div>
  )
}
