export type CurrencyCode = 'USD'

export const DEFAULT_CURRENCY: CurrencyCode = 'USD'
export const MIN_SAVING_AMOUNT = 5

export function normalizeCurrency(_value: unknown, fallback: CurrencyCode = 'USD'): CurrencyCode {
  return fallback
}

export function currencySymbol(_currency: CurrencyCode = 'USD') {
  return '$'
}

const MONEY_FRACTION_DIGITS = 2

export function formatAmount(value: unknown) {
  const amount = Number(value ?? 0)
  const safeAmount = Number.isFinite(amount) ? amount : 0
  return safeAmount.toLocaleString('en-US', {
    minimumFractionDigits: MONEY_FRACTION_DIGITS,
    maximumFractionDigits: MONEY_FRACTION_DIGITS,
  })
}

export function formatMoney(value: unknown, _currency: CurrencyCode = 'USD') {
  return `${currencySymbol()}${formatAmount(value)}`
}

export function predominantCurrency(
  _records: ReadonlyArray<{ currency?: CurrencyCode | null }>,
  fallback: CurrencyCode = 'USD'
): CurrencyCode {
  return fallback
}
