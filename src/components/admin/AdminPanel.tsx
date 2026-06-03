type AdminPanelProps = {
  title: string
  description?: string
  children: React.ReactNode
  footer?: React.ReactNode
}

export function AdminPanel({ title, description, children, footer }: AdminPanelProps) {
  return (
    <section className="w-full overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm ring-1 ring-slate-900/5">
      <div className="h-1 w-full bg-blue-800" />
      <div className="flex flex-col gap-1 border-b border-slate-100 px-6 py-5 md:px-8">
        <h3 className="text-lg font-bold tracking-tight text-slate-900">{title}</h3>
        {description && <p className="text-sm leading-6 text-slate-500">{description}</p>}
      </div>
      {children}
      {footer && (
        <div className="border-t border-slate-100 bg-slate-50/50 px-6 py-4 md:px-8">{footer}</div>
      )}
    </section>
  )
}
