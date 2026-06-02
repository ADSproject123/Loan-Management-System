type AdminHeroPanelProps = {
  children: React.ReactNode
  aside?: React.ReactNode
}

export function AdminHeroPanel({ children, aside }: AdminHeroPanelProps) {
  return (
    <section className="w-full overflow-hidden border border-gray-200 bg-white shadow-sm">
      <div className="h-1.5 w-full bg-linear-to-r from-blue-900 via-blue-700 to-blue-500" />
      <div className="flex flex-col gap-6 p-6 lg:flex-row lg:items-start lg:justify-between lg:p-8">
        <div className="min-w-0 flex-1">{children}</div>
        {aside}
      </div>
    </section>
  )
}
