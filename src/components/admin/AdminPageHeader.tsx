type AdminPageHeaderProps = {
  title: string
  description?: string
  eyebrow?: string
}

export function AdminPageHeader({
  title,
  description,
  eyebrow = 'អ្នកគ្រប់គ្រង',
}: AdminPageHeaderProps) {
  return (
    <div>
      <p className="text-sm font-semibold uppercase tracking-wide text-brand-700">{eyebrow}</p>
      <h2 className="mt-1 text-2xl font-bold text-foreground md:text-3xl">{title}</h2>
      {description && (
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">{description}</p>
      )}
    </div>
  )
}
