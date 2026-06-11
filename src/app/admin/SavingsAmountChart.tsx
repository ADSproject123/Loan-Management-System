'use client'

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatMoney } from '@/lib/currency'
import type { MonthlySavingsChartPoint } from '@/lib/admin/savingsChartData'

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: { value?: number }[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  const value = payload[0]?.value ?? 0

  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-md ring-1 ring-slate-900/5">
      <p className="mb-1 text-xs font-semibold text-slate-700">{label}</p>
      <p className="text-sm tabular-nums text-slate-900">{formatMoney(value)}</p>
    </div>
  )
}

export function SavingsAmountChart({ data }: { data: MonthlySavingsChartPoint[] }) {
  const total = data.reduce((sum, row) => sum + row.amount, 0)
  const isEmpty = total === 0
  const hasData = data.some((point) => point.amount > 0)

  if (isEmpty) {
    return (
      <p className="py-12 text-center text-sm text-slate-500">
        មិនទាន់មានការសន្សំផ្ទៀងផ្ទាត់សម្រាប់បង្ហាញក្រាប់។
      </p>
    )
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-500">
          សរុបក្នុងចន្លោះ៖{' '}
          <span className="font-bold tabular-nums text-brand-900">{formatMoney(total)}</span>
        </p>
      </div>

      {!hasData ? (
        <p className="flex h-[65vh] min-h-80 items-center justify-center text-sm text-slate-500">
          មិនមានការសន្សំ USD ក្នុង ១២ ខែចុងក្រោយ
        </p>
      ) : (
        <div className="h-[65vh] min-h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: '#64748b' }}
                tickLine={false}
                axisLine={{ stroke: '#e2e8f0' }}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#64748b' }}
                tickLine={false}
                axisLine={false}
                width={56}
                tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : String(v))}
              />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: '#f8fafc' }} />
              <Bar
                dataKey="amount"
                name="USD"
                fill="#1e3a8a"
                radius={[6, 6, 0, 0]}
                maxBarSize={48}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
