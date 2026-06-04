'use client'

import { useMemo } from 'react'
import { Select } from '@/components/ui/Select'
import { CURRENCIES, currencySymbol, type CurrencyCode } from '@/lib/currency'

const currencyTriggerClassName =
  'flex h-full w-full cursor-pointer items-center justify-between gap-2 rounded-lg border border-gray-300 bg-white px-3 py-3 text-sm font-medium text-gray-900 transition hover:bg-gray-50 focus:border-border focus:outline-none focus:ring-0 focus-visible:outline-none'

export function CurrencySelect({
  value,
  onChange,
  className = '',
}: {
  value: CurrencyCode
  onChange: (currency: CurrencyCode) => void
  className?: string
}) {
  const options = useMemo(
    () =>
      CURRENCIES.map((currency) => ({
        value: currency,
        label: currency,
        hint: currencySymbol(currency),
      })),
    []
  )

  return (
    <Select
      value={value}
      onChange={(next) => onChange(next as CurrencyCode)}
      options={options}
      className={className}
      triggerClassName={currencyTriggerClassName}
      menuClassName="right-0 left-auto w-40"
      aria-label="រូបិយប័ណ្ណ"
    />
  )
}
