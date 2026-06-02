'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { CURRENCIES, currencySymbol, type CurrencyCode } from '@/lib/currency'

export function CurrencySelect({
  value,
  onChange,
  className = '',
}: {
  value: CurrencyCode
  onChange: (currency: CurrencyCode) => void
  className?: string
}) {
  const [open, setOpen] = useState(false)

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex h-full w-full items-center justify-between gap-2 rounded-lg border border-gray-300 px-3 py-3 text-sm font-medium text-gray-900 transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <span className="flex items-center gap-1">
          {value}
          <span className="text-gray-400">({currencySymbol(value)})</span>
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-10 cursor-default"
            aria-label="បិទ"
            onClick={() => setOpen(false)}
          />
          <ul
            role="listbox"
            className="absolute right-0 top-full z-20 mt-2 w-40 overflow-hidden rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
          >
            {CURRENCIES.map((currency) => (
              <li key={currency} role="option" aria-selected={value === currency}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(currency)
                    setOpen(false)
                  }}
                  className={`flex w-full items-center justify-between gap-2 px-3 py-2.5 text-sm font-medium transition ${
                    value === currency
                      ? 'bg-blue-50 text-blue-900'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {currency}
                  <span className={value === currency ? 'text-blue-400' : 'text-gray-400'}>
                    {currencySymbol(currency)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}
