import { AdminBackLink } from './AdminBackLink'

type AdminPanelProps = {
  title?: string
  description?: string
  children: React.ReactNode
  footer?: React.ReactNode
  fill?: boolean
  backHref?: string
  backLabel?: string
  headerActions?: React.ReactNode
}

export function AdminPanel({ children, footer, backHref, backLabel = 'ត្រឡប់ក្រោយ', headerActions }: AdminPanelProps) {
  const showToolbar = Boolean(backHref || headerActions)

  return (
    <section className="flex min-h-screen w-full flex-col overflow-hidden bg-surface">
      {showToolbar && (
        <div className="flex flex-col gap-3 border-b border-border px-6 py-4 md:flex-row md:items-center md:justify-between md:px-8">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
            {backHref && <AdminBackLink href={backHref}>{backLabel}</AdminBackLink>}
          </div>
          {headerActions && <div className="flex flex-wrap items-center gap-3">{headerActions}</div>}
        </div>
      )}
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
      {footer && (
        <div className="bg-surface-muted/50 px-6 py-4 md:px-8">{footer}</div>
      )}
    </section>
  )
}
