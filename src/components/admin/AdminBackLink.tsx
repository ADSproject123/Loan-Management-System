import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

type AdminBackLinkProps = {
  href: string
  children: React.ReactNode
}

export function AdminBackLink({ href, children }: AdminBackLinkProps) {
  return (
    <Link
      href={href}
      className="inline-flex w-fit items-center gap-1.5 rounded-lg border border-border bg-surface px-3.5 py-2 text-sm font-semibold text-slate-600 shadow-xs transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
    >
      <ArrowLeft className="h-4 w-4 shrink-0" />
      {children}
    </Link>
  )
}
