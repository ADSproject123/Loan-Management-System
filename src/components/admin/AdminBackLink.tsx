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
      className="inline-flex w-fit items-center gap-2 bg-white px-3 py-2 text-sm font-medium text-blue-700 ring-1 ring-gray-200 transition hover:bg-blue-50 hover:text-blue-900"
    >
      <ArrowLeft className="h-4 w-4" />
      {children}
    </Link>
  )
}
