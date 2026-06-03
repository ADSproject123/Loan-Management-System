import { money } from '@/app/admin/adminUtils'
import type { AdminCurrencyTotals, AdminStatTone } from '@/components/admin/types'

const TONE_CLASSES: Record<AdminStatTone, string> = {
  blue: 'bg-blue-50 text-blue-900 ring-blue-100',
  amber: 'bg-amber-50 text-amber-900 ring-amber-100',
  emerald: 'bg-emerald-50 text-emerald-900 ring-emerald-100',
  slate: 'bg-slate-100 text-slate-800 ring-slate-200',
}

const ICON_TONE_CLASSES: Record<AdminStatTone, string> = {
  blue: 'bg-blue-100 text-blue-700',
  amber: 'bg-amber-100 text-amber-700',
  emerald: 'bg-emerald-100 text-emerald-700',
  slate: 'bg-white text-slate-600',
}

type AdminStatCardProps = {
  label: string
  value?: number | string
  currencyTotals?: AdminCurrencyTotals
  icon: React.ComponentType<{ className?: string }>
  tone: AdminStatTone
}

export function AdminStatCard({ label, value, currencyTotals, icon: Icon, tone }: AdminStatCardProps) {
  return (
    <div className={`rounded-2xl p-5 ring-1 ${TONE_CLASSES[tone]}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide opacity-70">{label}</p>
          {currencyTotals ? (
            <div className="mt-2 space-y-1">
              <p className="text-lg font-bold tabular-nums leading-tight">
                {money(currencyTotals.USD, 'USD')}
              </p>
              <p className="text-lg font-bold tabular-nums leading-tight">
                {money(currencyTotals.KHR, 'KHR')}
              </p>
            </div>
          ) : (
            <p className="mt-2 text-3xl font-bold tabular-nums">{value}</p>
          )}
        </div>
        <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${ICON_TONE_CLASSES[tone]}`}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </div>
  )
}
