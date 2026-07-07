import { dataTable, tableContainerFill, tableScroll } from '@/components/ui/tableStyles'

export const adminTable = {
  wrap: tableContainerFill,
  scroll: tableScroll,
  table: `${dataTable.table} min-w-160`,
  thead: dataTable.thead,
  thRow: dataTable.thRow,
  th: dataTable.th,
  thFirst: dataTable.th,
  thLast: dataTable.thRight,
  tbody: dataTable.tbody,
  trClickable:
    'group cursor-pointer bg-surface transition-colors hover:bg-brand-50/50 focus-visible:bg-brand-50/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-200',
  tr: dataTable.tr,
  trPending: 'bg-amber-50/30 hover:bg-amber-50/50',
  trOverdue: 'bg-red-50/20 hover:bg-red-50/35',
  td: dataTable.td,
  tdFirst: dataTable.td,
  tdLast: dataTable.tdRight,
  tdMuted: dataTable.tdMuted,
  tfoot: dataTable.tfoot,
  namePrimary: 'font-medium text-foreground',
  nameSecondary: 'truncate text-xs text-foreground',
  amountPrimary: 'font-semibold tabular-nums text-foreground',
  amountSecondary: 'mt-0.5 truncate text-xs text-foreground',
  missingText: 'text-sm text-foreground',
  rowChevron:
    'h-4 w-4 text-foreground opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100',
} as const

export function adminTableRowClass(options?: {
  pending?: boolean
  clickable?: boolean
  overdue?: boolean
}) {
  const { pending = false, clickable = false, overdue = false } = options ?? {}
  return [
    clickable ? adminTable.trClickable : adminTable.tr,
    pending ? adminTable.trPending : '',
    overdue ? adminTable.trOverdue : '',
  ]
    .filter(Boolean)
    .join(' ')
}
