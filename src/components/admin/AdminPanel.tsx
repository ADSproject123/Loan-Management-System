type AdminPanelProps = {
  title?: string
  description?: string
  children: React.ReactNode
  footer?: React.ReactNode
  fill?: boolean
}

export function AdminPanel({ title, description, children, footer }: AdminPanelProps) {
  return (
    <section className="flex min-h-screen w-full flex-col overflow-hidden bg-surface">
      <div className="app-accent-bar h-1 w-full" />
      {(title || description) && (
        <div className="flex flex-col gap-1 border-b border-border px-6 py-5 md:px-8">
          {title && <h3 className="text-lg font-bold tracking-tight text-foreground">{title}</h3>}
          {description && <p className="text-sm leading-6 text-muted">{description}</p>}
        </div>
      )}
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
      {footer && (
        <div className="bg-surface-muted/50 px-6 py-4 md:px-8">{footer}</div>
      )}
    </section>
  )
}
