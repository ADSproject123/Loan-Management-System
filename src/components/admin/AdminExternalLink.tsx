import { ExternalLink, FileText } from 'lucide-react'

type AdminExternalLinkProps = {
  href: string
  children: React.ReactNode
  icon?: React.ComponentType<{ className?: string }>
}

export function AdminExternalLink({
  href,
  children,
  icon: Icon = FileText,
}: AdminExternalLinkProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700 ring-1 ring-brand-100 transition hover:bg-brand-100"
    >
      <Icon className="h-3.5 w-3.5" />
      {children}
      <ExternalLink className="h-3.5 w-3.5" />
    </a>
  )
}
