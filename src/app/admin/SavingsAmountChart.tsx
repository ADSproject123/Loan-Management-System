'use client'

import { useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatMoney, type CurrencyCode } from '@/lib/currency'
import type { MonthlySavingsChartPoint } from '@/lib/admin/savingsChartData'

type ChartCurrency = 'USD' | 'KHR'

const CHART_CONFIG: Record<
  ChartCurrency,
  { dataKey: 'usd' | 'khr'; fill: string; emptyMessage: string }
> = {
  USD: {
    dataKey: 'usd',
    fill: '#1e3a8a',
    emptyMessage: 'មិនមានការសន្សំ USD ក្នុង ១២ ខែចុងក្រោយ',
  },
  KHR: {
    dataKey: 'khr',
    fill: '#047857',
    emptyMessage: 'មិនមានការសន្សំ KHR ក្នុង ១២ ខែចុងក្រោយ',
  },
}

function ChartTooltip({
  active,
  payload,
  label,
  currency,
}: {
  active?: boolean
  payload?: { value?: number }[]
  label?: string
  currency: CurrencyCode
}) {
  if (!active || !payload?.length) return null
  const value = payload[0]?.value ?? 0

  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-md ring-1 ring-slate-900/5">
      <p className="mb-1 text-xs font-semibold text-slate-700">{label}</p>
      <p className="text-sm tabular-nums text-slate-900">{formatMoney(value, currency)}</p>
    </div>
  )
}

function SavingsBarChart({
  data,
  currency,
}: {
  data: MonthlySavingsChartPoint[]
  currency: ChartCurrency
}) {
  const { dataKey, fill, emptyMessage } = CHART_CONFIG[currency]
  const hasData = data.some((point) => point[dataKey] > 0)

  if (!hasData) {
    return (
      <p className="flex h-64 items-center justify-center text-sm text-slate-500">{emptyMessage}</p>
    )
  }

  return (
    <div className="h-64 w-full">
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
          <Tooltip
            content={<ChartTooltip currency={currency} />}
            cursor={{ fill: '#f8fafc' }}
          />
          <Bar
            dataKey={dataKey}
            name={currency}
            fill={fill}
            radius={[6, 6, 0, 0]}
            maxBarSize={48}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function SavingsAmountChart({ data }: { data: MonthlySavingsChartPoint[] }) {
  const [currency, setCurrency] = useState<ChartCurrency>('USD')
  const totalUsd = data.reduce((sum, row) => sum + row.usd, 0)
  const totalKhr = data.reduce((sum, row) => sum + row.khr, 0)
  const isEmpty = totalUsd === 0 && totalKhr === 0
  const activeTotal = currency === 'USD' ? totalUsd : totalKhr

  const tabs: { id: ChartCurrency; label: string }[] = [
    { id: 'USD', label: 'USD' },
    { id: 'KHR', label: 'KHR' },
  ]

  return (
    <div>
      {isEmpty ? (
        <p className="py-12 text-center text-sm text-slate-500">
          មិនទាន់មានការសន្សំផ្ទៀងផ្ទាត់សម្រាប់បង្ហាញក្រាប់។
        </p>
      ) : (
        <>
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div
              className="inline-flex rounded-xl border border-slate-200 bg-background p-1"
              role="tablist"
              aria-label="រូបិយប័ណ្ណក្រាប់"
            >
              {tabs.map((tab) => {
                const isActive = currency === tab.id
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setCurrency(tab.id)}
                    className={`min-w-20 rounded-lg px-4 py-2 text-sm font-semibold transition ${
                      isActive
                        ? 'bg-white text-brand-900 shadow-sm ring-1 ring-slate-200'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {tab.label}
                  </button>
                )
              })}
            </div>
            <p className="text-sm text-slate-500">
              សរុប ១២ ខែ៖{' '}
              <span
                className={`font-bold tabular-nums ${
                  currency === 'USD' ? 'text-brand-900' : 'text-emerald-800'
                }`}
              >
                {formatMoney(activeTotal, currency)}
              </span>
            </p>
          </div>

          <div role="tabpanel">
            <SavingsBarChart key={currency} data={data} currency={currency} />
          </div>
        </>
      )}
    </div>
  )
}
