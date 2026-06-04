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
      className="inline-flex w-fit items-center gap-2 bg-surface px-3 py-2 text-sm font-medium text-brand-700 ring-1 ring-border transition hover:bg-brand-50 hover:text-brand-900"
    >
      <ArrowLeft className="h-4 w-4" />
      {children}
    </Link>
  )
}
