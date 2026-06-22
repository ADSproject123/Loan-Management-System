import type { WorkplaceType } from '@/types/database'

export const WORKPLACE_OPTIONS: { value: WorkplaceType; label: string }[] = [
  { value: 'private_company', label: 'ក្រុមហ៊ុនឯកជន' },
  { value: 'government',      label: 'ស្ថាប័នរដ្ឋ' },
  { value: 'ngo',             label: 'អង្គការ / NGO' },
  { value: 'self_employed',   label: 'ធ្វើការដោយខ្លួនឯង' },
  { value: 'other',           label: 'ផ្សេងៗ' },
]

export const WORKPLACE_LABELS: Record<WorkplaceType, string> = Object.fromEntries(
  WORKPLACE_OPTIONS.map((o) => [o.value, o.label])
) as Record<WorkplaceType, string>
