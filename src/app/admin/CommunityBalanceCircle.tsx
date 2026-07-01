'use client'

import Link from 'next/link'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { formatMoney } from '@/lib/currency'

type BalanceSlice = {
  label: string
  value: number
  color: string
}

type Props = {
  netTotal: number
  savingsTotal: number
  accruedInterest: number
  loanRemaining: number
  memberCount: number
  savingsCount: number
  compact?: boolean
  fillHeight?: boolean
}

function ChartTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: { name?: string; value?: number; payload?: BalanceSlice }[]
}) {
  if (!active || !payload?.length) return null
  const slice = payload[0]

  return (
    <div className="rounded-xl border border-border bg-surface px-3 py-2 shadow-md ring-1 ring-foreground/5">
      <p className="mb-1 flex items-center gap-2 text-xs font-semibold text-foreground">
        <span
          className="inline-block h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: slice?.payload?.color }}
        />
        {slice?.name}
      </p>
      <p className="text-sm tabular-nums text-foreground">{formatMoney(slice?.value ?? 0)}</p>
    </div>
  )
}

export function CommunityBalanceCircle({
  netTotal,
  savingsTotal,
  accruedInterest,
  loanRemaining,
  memberCount,
  savingsCount,
  compact = false,
  fillHeight = false,
}: Props) {
  const balanceSlices: BalanceSlice[] = [
    { label: 'សន្សំ', value: savingsTotal, color: '#10b981' },
    { label: 'ការប្រាក់', value: accruedInterest, color: '#6366f1' },
    { label: 'កម្ជីនៅសល់', value: loanRemaining, color: '#f59e0b' },
  ].filter((slice) => slice.value > 0)

  const hasChartData = balanceSlices.length > 0

  const chartSizeClass = fillHeight
    ? 'aspect-square h-full max-h-full w-full max-w-[min(100%,72vh)] min-h-48'
    : compact
      ? 'h-52 w-52 sm:h-56 sm:w-56'
      : 'h-64 w-64 sm:h-72 sm:w-72'

  return (
    <div
      className={`flex flex-col items-center px-4 ${
        fillHeight
          ? 'h-full min-h-0 justify-center gap-4 py-4'
          : compact
            ? 'h-full justify-center py-5 lg:py-6'
            : 'py-6 md:py-8'
      }`}
    >
      <div className={fillHeight ? 'flex min-h-0 w-full flex-1 items-center justify-center' : 'w-full'}>
        <div className={`relative mx-auto max-w-full ${chartSizeClass}`}>
        {hasChartData ? (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={balanceSlices}
                dataKey="value"
                nameKey="label"
                innerRadius="68%"
                outerRadius="92%"
                paddingAngle={balanceSlices.length > 1 ? 3 : 0}
                stroke="none"
                startAngle={90}
                endAngle={-270}
              >
                {balanceSlices.map((slice) => (
                  <Cell key={slice.label} fill={slice.color} />
                ))}
              </Pie>
              <Tooltip content={<ChartTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <div className="h-full w-full rounded-full border-14 border-border/80 bg-surface-muted/30" />
          </div>
        )}

        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">សមតុល្យសហគមន៍សរុប</p>
          <p
            className={`mt-1 font-bold tabular-nums tracking-tight ${
              fillHeight ? 'text-3xl sm:text-4xl' : 'text-2xl sm:text-3xl'
            } ${netTotal < 0 ? 'text-red-600' : 'text-foreground'}`}
          >
            {formatMoney(netTotal)}
          </p>
          <p className="mt-1 text-[11px] leading-snug text-muted">សន្សំ + ការប្រាក់ − កម្ជីនៅសល់</p>
        </div>
        </div>
      </div>

      <ul
        className={`shrink-0 flex w-full flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm ${
          fillHeight ? 'mt-4 max-w-lg' : compact ? 'mt-5 max-w-xs lg:max-w-sm' : 'mt-6 max-w-md'
        }`}
      >
        <li className="flex items-center gap-2 text-muted">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500" />
          សន្សំ
          <span className="font-semibold tabular-nums text-foreground">{formatMoney(savingsTotal)}</span>
        </li>
        <li className="flex items-center gap-2 text-muted">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-indigo-500" />
          ការប្រាក់
          <span className="font-semibold tabular-nums text-foreground">{formatMoney(accruedInterest)}</span>
        </li>
        <li className="flex items-center gap-2 text-muted">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-amber-500" />
          កម្ជីនៅសល់
          <span className="font-semibold tabular-nums text-foreground">−{formatMoney(loanRemaining)}</span>
        </li>
      </ul>

      <p className={`shrink-0 text-center text-xs text-muted ${fillHeight || compact ? 'mt-3' : 'mt-4'}`}>
        សមាជិក {memberCount} នាក់ · ការសន្សំផ្ទៀងផ្ទាត់ {savingsCount} ដំណើរ
      </p>

      <div className={`shrink-0 flex flex-wrap items-center justify-center gap-4 ${fillHeight || compact ? 'mt-3' : 'mt-4'}`}>
        <Link href="/admin/savings" className="text-sm font-semibold text-brand-700 hover:text-brand-900">
          មើលសន្សំ →
        </Link>
        <Link href="/admin/loans/active" className="text-sm font-semibold text-brand-700 hover:text-brand-900">
          មើលកម្ជី →
        </Link>
      </div>
    </div>
  )
}
