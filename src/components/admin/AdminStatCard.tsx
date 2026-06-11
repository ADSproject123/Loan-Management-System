import { money } from '@/app/admin/adminUtils'
import type { AdminStatTone } from '@/components/admin/types'

const TONE_CLASSES: Record<AdminStatTone, string> = {
  blue: 'bg-brand-50 text-brand-900 ring-brand-100',
  amber: 'bg-amber-50 text-amber-900 ring-amber-100',
  emerald: 'bg-emerald-50 text-emerald-900 ring-emerald-100',
  slate: 'bg-surface-muted text-slate-800 ring-border',
}

const ICON_TONE_CLASSES: Record<AdminStatTone, string> = {
  blue: 'bg-brand-100 text-brand-700',
  amber: 'bg-amber-100 text-amber-700',
  emerald: 'bg-emerald-100 text-emerald-700',
  slate: 'bg-surface text-muted',
}

type AdminStatCardProps = {
  label: string
  value?: number | string
  amountTotal?: number
  subtitle?: React.ReactNode
  icon: React.ComponentType<{ className?: string }>
  tone: AdminStatTone
  className?: string
}

export function AdminStatCard({
  label,
  value,
  amountTotal,
  subtitle,
  icon: Icon,
  tone,
  className,
}: AdminStatCardProps) {
  const hasValue = value !== undefined && value !== ''

  return (
    <div
      className={`flex h-full min-h-40 flex-col rounded-2xl p-5 ring-1 ${TONE_CLASSES[tone]} ${className ?? ''}`}
    >
      <div className="flex flex-1 items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 flex-col">
          <p className="text-xs font-semibold uppercase tracking-wide opacity-70">{label}</p>
          <div className="mt-2 min-h-22">
            {hasValue && <p className="text-3xl font-bold tabular-nums">{value}</p>}
            {amountTotal !== undefined && (
              <p className={`${hasValue ? 'mt-2' : ''} text-lg font-bold tabular-nums leading-tight`}>
                {money(amountTotal)}
              </p>
            )}
          </div>
          {subtitle ? <p className="mt-auto text-sm opacity-80">{subtitle}</p> : null}
        </div>
        <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${ICON_TONE_CLASSES[tone]}`}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </div>
  )
}
