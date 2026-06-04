type AdminHeroPanelProps = {
  children: React.ReactNode
  aside?: React.ReactNode
}

export function AdminHeroPanel({ children, aside }: AdminHeroPanelProps) {
  return (
    <section className="w-full overflow-hidden rounded-2xl border border-border bg-surface shadow-sm ring-1 ring-foreground/5">
      <div className="app-accent-bar h-1.5 w-full" />
      <div className="flex flex-col gap-6 p-6 lg:flex-row lg:items-start lg:justify-between lg:p-8">
        <div className="min-w-0 flex-1">{children}</div>
        {aside}
      </div>
    </section>
  )
}
