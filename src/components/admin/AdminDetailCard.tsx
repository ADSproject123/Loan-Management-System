type AdminDetailCardProps = {
  title: string
  children: React.ReactNode
  className?: string
}

export function AdminDetailCard({ title, children, className = '' }: AdminDetailCardProps) {
  return (
    <section className={`border border-gray-200 bg-white p-6 shadow-sm md:p-8 ${className}`}>
      <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      <div className="mt-5">{children}</div>
    </section>
  )
}
