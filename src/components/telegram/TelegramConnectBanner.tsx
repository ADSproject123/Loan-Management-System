import Link from 'next/link'
import { Send } from 'lucide-react'

export function TelegramConnectBanner() {
  return (
    <div className="border-b border-sky-200 bg-sky-50 px-6 py-3 md:px-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white text-sky-600 ring-1 ring-sky-100">
            <Send className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900">ភ្ជាប់ Telegram ដើម្បីទទួលការជូនដំណឹង</p>
            <p className="text-xs leading-5 text-slate-600">
              ប្រើតំណភ្ជាប់ផ្ទាល់ខ្លួនរបស់អ្នក បើក bot ហើយចុច Start។
            </p>
          </div>
        </div>
        <Link
          href="/dashboard/telegram"
          className="inline-flex shrink-0 items-center justify-center rounded-xl bg-[#229ED9] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1c8dc2]"
        >
          ភ្ជាប់ឥឡូវនេះ
        </Link>
      </div>
    </div>
  )
}

export const TELEGRAM_CONNECT_STEPS = [
  'ចម្លងតំណភ្ជាប់ផ្ទាល់ខ្លួន ឬ ផ្ញើឱ្យសមាជិក',
  'សមាជិកបើក Telegram ហើយចុច Start',
  'ប្រព័ន្ធភ្ជាប់គណនីដោយស្វ័យប្រវត្តិ',
] as const

export function TelegramConnectSteps({ className = '' }: { className?: string }) {
  return (
    <ol className={`space-y-2 ${className}`}>
      {TELEGRAM_CONNECT_STEPS.map((step, index) => (
        <li key={step} className="flex items-start gap-3 text-sm text-slate-700">
          <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-950 text-xs font-semibold text-white">
            {index + 1}
          </span>
          <span className="pt-0.5 leading-6">{step}</span>
        </li>
      ))}
    </ol>
  )
}
