'use client'

import { useMemo, useState, type ReactNode } from 'react'
import { format, subMonths } from 'date-fns'
import type { LucideIcon } from 'lucide-react'
import { LayoutDashboard, ChartPie, PiggyBank, Landmark, Coins, TrendingUp } from 'lucide-react'
import { AdminSegmentedTabs } from '@/components/admin'
import { SavingsAmountChart } from '@/app/admin/SavingsAmountChart'
import { LoanAmountChart } from '@/app/admin/LoanAmountChart'
import { InterestAmountChart } from '@/app/admin/InterestAmountChart'
import { PortfolioPieChart, type PortfolioSlice } from '@/app/admin/PortfolioPieChart'
import {
  buildMonthlySavingsChartData,
  type SavingChartSourceRow,
} from '@/lib/admin/savingsChartData'
import {
  buildMonthlyLoanChartData,
  type LoanChartSourceRow,
} from '@/lib/admin/loanChartData'
import {
  buildMonthlyLoanInterestChartData,
  buildMonthlySavingInterestChartData,
} from '@/lib/admin/interestChartData'
import type { ActiveLoanDueRow, LoanRepaymentAmountRow } from '@/lib/admin/loanRepaymentDue'
import type { VerifiedSavingInterestRow } from '@/lib/admin/savingInterestDue'

type TabId = 'overview' | 'portfolio' | 'savings' | 'loans' | 'saving-interest' | 'loan-interest'

const TABS: { id: TabId; label: string; icon: LucideIcon; subtitle?: string }[] = [
  {
    id: 'overview',
    label: 'ទិដ្ឋភាពទូទៅ',
    icon: LayoutDashboard,
  },
  {
    id: 'portfolio',
    label: 'សមាមាត្រផលប័ត្រ',
    icon: ChartPie,
    subtitle: 'ការបែងចែករវាង សន្សំ · កម្ជីសកម្ម · ប្រាក់សង',
  },
  {
    id: 'savings',
    label: 'ក្រាប់ការសន្សំ',
    icon: PiggyBank,
    subtitle: 'ចំនួនដាក់សន្សំផ្ទៀងផ្ទាត់ប្រចាំខែ',
  },
  {
    id: 'loans',
    label: 'ក្រាប់កម្ជី',
    icon: Landmark,
    subtitle: 'ចំនួនកម្ជីដែលបានផ្តល់ប្រចាំខែ',
  },
  {
    id: 'saving-interest',
    label: 'ការប្រាក់សន្សំ',
    icon: Coins,
    subtitle: 'ការប្រាក់សន្សំត្រូវបង់ប្រចាំខែ',
  },
  {
    id: 'loan-interest',
    label: 'ការប្រាក់កម្ជី',
    icon: TrendingUp,
    subtitle: 'ការប្រាក់កម្ជីដែលទទួលបានប្រចាំខែ',
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
  savingsInterestRows,
  activeLoanRows,
  loanRepaymentRows,
  monthlySavingInterestRate,
  monthlyLoanInterestRate,
  asOfDate,
  defaultFromKey,
  defaultToKey,
}: {
  overview: ReactNode
  portfolioData: PortfolioSlice[]
  savingsRows: SavingChartSourceRow[]
  loanRows: LoanChartSourceRow[]
  savingsInterestRows: VerifiedSavingInterestRow[]
  activeLoanRows: ActiveLoanDueRow[]
  loanRepaymentRows: LoanRepaymentAmountRow[]
  monthlySavingInterestRate: number
  monthlyLoanInterestRate: number
  asOfDate: string
  defaultFromKey: string
  defaultToKey: string
}) {
  const [activeTab, setActiveTab] = useState<TabId>('overview')
  const [fromMonth, setFromMonth] = useState(defaultFromKey)
  const [toMonth, setToMonth] = useState(defaultToKey)

  const active = TABS.find((tab) => tab.id === activeTab) ?? TABS[0]
  const showFilter =
    activeTab === 'savings' ||
    activeTab === 'loans' ||
    activeTab === 'saving-interest' ||
    activeTab === 'loan-interest'

  const savingsData = useMemo(
    () => buildMonthlySavingsChartData(savingsRows, { fromKey: fromMonth, toKey: toMonth }),
    [savingsRows, fromMonth, toMonth]
  )
  const loanData = useMemo(
    () => buildMonthlyLoanChartData(loanRows, { fromKey: fromMonth, toKey: toMonth }),
    [loanRows, fromMonth, toMonth]
  )
  const savingInterestData = useMemo(
    () =>
      buildMonthlySavingInterestChartData(
        savingsInterestRows,
        monthlySavingInterestRate,
        { fromKey: fromMonth, toKey: toMonth },
        asOfDate
      ),
    [savingsInterestRows, monthlySavingInterestRate, fromMonth, toMonth, asOfDate]
  )
  const loanInterestData = useMemo(
    () =>
      buildMonthlyLoanInterestChartData(
        activeLoanRows,
        loanRepaymentRows,
        monthlyLoanInterestRate,
        { fromKey: fromMonth, toKey: toMonth },
        asOfDate
      ),
    [
      activeLoanRows,
      loanRepaymentRows,
      monthlyLoanInterestRate,
      fromMonth,
      toMonth,
      asOfDate,
    ]
  )

  const activePreset = PRESETS.find(
    (preset) => toMonth === defaultToKey && fromMonth === shiftMonthKey(defaultToKey, preset.months - 1)
  )?.months

  function applyPreset(months: number) {
    setToMonth(defaultToKey)
    setFromMonth(shiftMonthKey(defaultToKey, months - 1))
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6">
      <AdminSegmentedTabs
        tabs={TABS}
        activeTab={activeTab}
        onChange={setActiveTab}
        ariaLabel="ផ្ទាំងគ្រប់គ្រង"
        size="md"
        className="w-full sm:w-auto"
      />

      <div className="flex min-h-0 flex-1 flex-col gap-6">
        {(active.subtitle || showFilter) && (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            {active.subtitle ? (
              <p className="shrink-0 text-sm text-muted">{active.subtitle}</p>
            ) : (
              <span />
            )}
            {showFilter && (
              <div className="flex flex-wrap items-end gap-3 sm:ml-auto">
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
        )}

        <div className="flex min-h-0 flex-1 flex-col">
          {activeTab === 'overview' && overview}
          {activeTab === 'portfolio' && <PortfolioPieChart data={portfolioData} />}
          {activeTab === 'savings' && <SavingsAmountChart data={savingsData} />}
          {activeTab === 'loans' && <LoanAmountChart data={loanData} />}
          {activeTab === 'saving-interest' && (
            <InterestAmountChart
              data={savingInterestData}
              barColor="#10b981"
              emptyMessage="មិនទាន់មានការប្រាក់សន្សំសម្រាប់បង្ហាញក្រាប់។"
              rangeEmptyMessage="មិនមានការប្រាក់សន្សំក្នុងចន្លោះខែដែលបានជ្រើស"
            />
          )}
          {activeTab === 'loan-interest' && (
            <InterestAmountChart
              data={loanInterestData}
              barColor="#f59e0b"
              emptyMessage="មិនទាន់មានការប្រាក់កម្ជីសម្រាប់បង្ហាញក្រាប់។"
              rangeEmptyMessage="មិនមានការប្រាក់កម្ជីក្នុងចន្លោះខែដែលបានជ្រើស"
            />
          )}
        </div>
      </div>
    </div>
  )
}
