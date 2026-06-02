export type CurrencyCode = 'KHR' | 'USD'

export const CURRENCIES: CurrencyCode[] = ['KHR', 'USD']

export function normalizeCurrency(value: unknown, fallback: CurrencyCode = 'USD'): CurrencyCode {
  return value === 'KHR' || value === 'USD' ? value : fallback
}

export function currencySymbol(currency: CurrencyCode) {
  return currency === 'KHR' ? '៛' : '$'
}

export function formatMoney(value: unknown, currency: CurrencyCode = 'USD') {
  const amount = Number(value ?? 0)
  const safeAmount = Number.isFinite(amount) ? amount : 0
  return `${currencySymbol(currency)}${safeAmount.toLocaleString()}`
}

/**
 * Returns the most frequently used currency across the given records,
 * falling back to `fallback` when none carry a recognised currency.
 * Useful for summary totals that aggregate records of mixed currencies.
 */
export function predominantCurrency(
  records: ReadonlyArray<{ currency?: CurrencyCode | null }>,
  fallback: CurrencyCode = 'USD'
): CurrencyCode {
  const tally: Record<CurrencyCode, number> = { KHR: 0, USD: 0 }
  for (const record of records) {
    if (record.currency === 'KHR' || record.currency === 'USD') {
      tally[record.currency] += 1
    }
  }
  let best: CurrencyCode | null = null
  for (const currency of CURRENCIES) {
    if (best === null ? tally[currency] > 0 : tally[currency] > tally[best]) {
      best = currency
    }
  }
  return best ?? fallback
}
