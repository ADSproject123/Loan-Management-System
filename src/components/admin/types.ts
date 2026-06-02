import type { CurrencyCode } from '@/lib/currency'

export type AdminStatTone = 'blue' | 'amber' | 'emerald' | 'slate'

export type AdminCurrencyTotals = Record<CurrencyCode, number>
