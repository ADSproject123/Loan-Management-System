type AdminStatusPillProps = {
  children: React.ReactNode
  variant: 'success' | 'warning'
}

export function AdminStatusPill({ children, variant }: AdminStatusPillProps) {
  const classes =
    variant === 'success'
      ? 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-100'
      : 'bg-amber-50 text-amber-800 ring-1 ring-amber-100'

  return (
    <span className={`px-3 py-1 text-xs font-semibold ${classes}`}>{children}</span>
  )
}
