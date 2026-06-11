'use client'

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { formatMoney } from '@/lib/currency'

export type PortfolioSlice = {
  label: string
  value: number
  color: string
}

function ChartTooltip({
  active,
  payload,
  total,
}: {
  active?: boolean
  payload?: { name?: string; value?: number; payload?: PortfolioSlice }[]
  total: number
}) {
  if (!active || !payload?.length) return null
  const slice = payload[0]
  const value = slice?.value ?? 0
  const percent = total > 0 ? Math.round((value / total) * 100) : 0

  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-md ring-1 ring-slate-900/5">
      <p className="mb-1 flex items-center gap-2 text-xs font-semibold text-slate-700">
        <span
          className="inline-block h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: slice?.payload?.color }}
        />
        {slice?.name}
      </p>
      <p className="text-sm tabular-nums text-slate-900">
        {formatMoney(value)} · {percent}%
      </p>
    </div>
  )
}

export function PortfolioPieChart({ data }: { data: PortfolioSlice[] }) {
  const slices = data.filter((slice) => slice.value > 0)
  const total = slices.reduce((sum, slice) => sum + slice.value, 0)

  if (total === 0) {
    return (
      <p className="py-12 text-center text-sm text-slate-500">
        មិនទាន់មានទិន្នន័យសម្រាប់បង្ហាញក្រាប់រង្វង់។
      </p>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center gap-6 sm:flex-row sm:items-center sm:gap-8">
      <div className="h-[55vh] min-h-80 w-full max-w-sm">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={slices}
              dataKey="value"
              nameKey="label"
              innerRadius={56}
              outerRadius={88}
              paddingAngle={2}
              stroke="none"
            >
              {slices.map((slice) => (
                <Cell key={slice.label} fill={slice.color} />
              ))}
            </Pie>
            <Tooltip content={<ChartTooltip total={total} />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <ul className="w-full space-y-3 sm:flex-1">
        {slices.map((slice) => {
          const percent = total > 0 ? Math.round((slice.value / total) * 100) : 0
          return (
            <li key={slice.label} className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-2 text-sm text-slate-600">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: slice.color }}
                />
                {slice.label}
              </span>
              <span className="text-sm font-semibold tabular-nums text-brand-900">
                {formatMoney(slice.value)}{' '}
                <span className="text-xs font-normal text-slate-400">{percent}%</span>
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
