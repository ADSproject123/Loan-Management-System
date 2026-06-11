'use client'

import { useMemo, useState, type ReactNode } from 'react'
import { format, subMonths } from 'date-fns'
import { LayoutDashboard, ChartPie, PiggyBank, Landmark } from 'lucide-react'
import { SavingsAmountChart } from '@/app/admin/SavingsAmountChart'
import { LoanAmountChart } from '@/app/admin/LoanAmountChart'
import { PortfolioPieChart, type PortfolioSlice } from '@/app/admin/PortfolioPieChart'
import {
  buildMonthlySavingsChartData,
  type SavingChartSourceRow,
} from '@/lib/admin/savingsChartData'
import {
  buildMonthlyLoanChartData,
  type LoanChartSourceRow,
} from '@/lib/admin/loanChartData'

type TabId = 'overview' | 'portfolio' | 'savings' | 'loans'

const TABS: { id: TabId; label: string; icon: React.ReactNode; subtitle?: string }[] = [
  {
    id: 'overview',
    label: 'ទិដ្ឋភាពទូទៅ',
    icon: <LayoutDashboard className="h-4 w-4" />,
  },
  {
    id: 'portfolio',
    label: 'សមាមាត្រផលប័ត្រ',
    icon: <ChartPie className="h-4 w-4" />,
    subtitle: 'ការបែងចែករវាង សន្សំ · កម្ជីសកម្ម · ប្រាក់សង',
  },
  {
    id: 'savings',
    label: 'ក្រាប់ការសន្សំ',
    icon: <PiggyBank className="h-4 w-4" />,
    subtitle: 'ចំនួនដាក់សន្សំផ្ទៀងផ្ទាត់ប្រចាំខែ',
  },
  {
    id: 'loans',
    label: 'ក្រាប់កម្ជី',
    icon: <Landmark className="h-4 w-4" />,
    subtitle: 'ចំនួនកម្ជីដែលបានផ្តល់ប្រចាំខែ',
  },
]

const PRESETS = [
  { label: '៣ ខែ', months: 3 },
  { label: '៦ ខែ', months: 6 },
  { label: '១២ ខែ', months: 12 },
]

function shiftMonthKey(key: string, monthsBack: number) {
  const [year, month] = key.split('-').map(Number)
  return format(subMonths(new Date(year, month - 1, 1), monthsBack), 'yyyy-MM')
}

export function DashboardCharts({
  overview,
  portfolioData,
  savingsRows,
  loanRows,
  defaultFromKey,
  defaultToKey,
}: {
  overview: ReactNode
  portfolioData: PortfolioSlice[]
  savingsRows: SavingChartSourceRow[]
  loanRows: LoanChartSourceRow[]
  defaultFromKey: string
  defaultToKey: string
}) {
  const [activeTab, setActiveTab] = useState<TabId>('overview')
  const [fromMonth, setFromMonth] = useState(defaultFromKey)
  const [toMonth, setToMonth] = useState(defaultToKey)

  const active = TABS.find((tab) => tab.id === activeTab) ?? TABS[0]
  const showFilter = activeTab === 'savings' || activeTab === 'loans'

  const savingsData = useMemo(
    () => buildMonthlySavingsChartData(savingsRows, { fromKey: fromMonth, toKey: toMonth }),
    [savingsRows, fromMonth, toMonth]
  )
  const loanData = useMemo(
    () => buildMonthlyLoanChartData(loanRows, { fromKey: fromMonth, toKey: toMonth }),
    [loanRows, fromMonth, toMonth]
  )

  const activePreset = PRESETS.find(
    (preset) => toMonth === defaultToKey && fromMonth === shiftMonthKey(defaultToKey, preset.months - 1)
  )?.months

  function applyPreset(months: number) {
    setToMonth(defaultToKey)
    setFromMonth(shiftMonthKey(defaultToKey, months - 1))
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col border-t border-border pt-8">
      <nav
        className="-mb-px flex w-full shrink-0 gap-1 overflow-x-auto"
        aria-label="ក្រាប់ផ្ទាំងគ្រប់គ្រង"
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-semibold transition ${
                isActive
                  ? 'border-brand-900 text-brand-900'
                  : 'border-transparent text-muted hover:border-border hover:text-foreground'
              }`}
            >
              <span className={isActive ? 'text-brand-900' : 'text-muted'}>{tab.icon}</span>
              {tab.label}
            </button>
          )
        })}
      </nav>

      <div className="flex min-h-0 flex-1 flex-col border-t border-border pt-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          {active.subtitle && (
            <p className="shrink-0 text-sm text-muted">{active.subtitle}</p>
          )}
          {showFilter && (
            <div className="flex flex-wrap items-end gap-3">
              <label className="flex flex-col gap-1 text-xs font-semibold text-muted">
                ពីខែ
                <input
                  type="month"
                  value={fromMonth}
                  max={toMonth}
                  onChange={(event) => setFromMonth(event.target.value)}
                  className="rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium text-foreground shadow-xs focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs font-semibold text-muted">
                ដល់ខែ
                <input
                  type="month"
                  value={toMonth}
                  min={fromMonth}
                  max={defaultToKey}
                  onChange={(event) => setToMonth(event.target.value)}
                  className="rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium text-foreground shadow-xs focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100"
                />
              </label>
              <div className="flex gap-1.5">
                {PRESETS.map((preset) => {
                  const isActive = activePreset === preset.months
                  return (
                    <button
                      key={preset.months}
                      type="button"
                      onClick={() => applyPreset(preset.months)}
                      className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                        isActive
                          ? 'border-brand-900 bg-brand-50 text-brand-900'
                          : 'border-border text-muted hover:border-brand-200 hover:text-foreground'
                      }`}
                    >
                      {preset.label}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
        <div className="mt-6 flex min-h-0 flex-1 flex-col">
          {activeTab === 'overview' && overview}
          {activeTab === 'portfolio' && <PortfolioPieChart data={portfolioData} />}
          {activeTab === 'savings' && <SavingsAmountChart data={savingsData} />}
          {activeTab === 'loans' && <LoanAmountChart data={loanData} />}
        </div>
      </div>
    </div>
  )
}
