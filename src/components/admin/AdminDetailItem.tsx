type AdminDetailItemProps = {
  label: string
  value: string
  icon?: React.ComponentType<{ className?: string }>
}

export function AdminDetailItem({ label, value, icon: Icon }: AdminDetailItemProps) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</dt>
      <dd className="mt-1 flex items-center gap-2 text-sm font-medium text-gray-900">
        {Icon && <Icon className="h-4 w-4 shrink-0 text-gray-400" />}
        {value}
      </dd>
    </div>
  )
}
