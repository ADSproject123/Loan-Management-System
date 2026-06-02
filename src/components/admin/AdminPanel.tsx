type AdminPanelProps = {
  title: string
  description?: string
  children: React.ReactNode
  footer?: React.ReactNode
}

export function AdminPanel({ title, description, children, footer }: AdminPanelProps) {
  return (
    <section className="w-full overflow-hidden border border-gray-200 bg-white shadow-sm">
      <div className="h-1.5 w-full bg-linear-to-r from-blue-900 via-blue-700 to-blue-500" />
      <div className="flex flex-col gap-1 border-b border-gray-100 px-6 py-5 md:px-8">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        {description && <p className="text-sm text-gray-500">{description}</p>}
      </div>
      {children}
      {footer && (
        <div className="border-t border-gray-100 px-6 py-4 md:px-8">{footer}</div>
      )}
    </section>
  )
}
