import type { Metadata } from 'next'
import Link from 'next/link'
import { Home, LogIn, SearchX } from 'lucide-react'
import { HistoryBackButton } from '@/components/ui/HistoryBackButton'

export const metadata: Metadata = {
  title: 'រកមិនឃើញទំព័រ | សន្សំ',
  description: 'ទំព័រដែលអ្នកស្វែងរកមិនមាន ឬ ត្រូវបានផ្លាស់ទី។',
}

export default function NotFound() {
  return (
    <main className="font-khmer flex min-h-screen flex-col items-center justify-center bg-background px-4 py-16">
      <div className="w-full max-w-lg text-center">
        <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-2xl bg-brand-950 text-white shadow-sm ring-1 ring-brand-950/10">
          <SearchX className="h-10 w-10" strokeWidth={1.75} aria-hidden />
        </div>

        <p className="text-sm font-semibold uppercase tracking-widest text-brand-900">404</p>
        <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 md:text-4xl">
          រកមិនឃើញទំព័រ
        </h1>
        <p className="mt-4 text-base leading-7 text-slate-600">
          ទំព័រដែលអ្នកបើកមិនមាន ឬ ត្រូវបានផ្លាស់ទី។ សូមពិនិត្យតំណភ្ជាប់ ឬ ត្រឡប់ទៅទំព័រដើម។
        </p>

        <div className="mt-10 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-950 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-800"
          >
            <Home className="h-4 w-4" aria-hidden />
            ទំព័រដើម
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-brand-900 bg-white px-6 py-3 text-sm font-semibold text-brand-900 transition-colors hover:bg-brand-50"
          >
            <LogIn className="h-4 w-4" aria-hidden />
            ចូលគណនី
          </Link>
        </div>

        <div className="mt-6">
          <HistoryBackButton />
        </div>
      </div>
    </main>
  )
}
