export const adminTable = {
  wrap: 'flex-1 overflow-auto min-h-0 pb-6',
  table: 'w-full min-w-160 text-left text-sm',
  thead: 'sticky top-0 z-10 border-b border-border bg-surface-muted/95 backdrop-blur-sm',
  thRow: 'text-xs font-bold uppercase tracking-wide text-foreground',
  th: 'px-6 py-3.5 whitespace-nowrap',
  thFirst: 'px-6 py-3.5 md:px-8 whitespace-nowrap',
  thLast: 'px-6 py-3.5 text-right md:px-8 whitespace-nowrap',
  tbody: 'divide-y divide-border',
  trClickable: 'group cursor-pointer transition-colors hover:bg-brand-50/50 focus-visible:bg-brand-50/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-200',
  tr: 'transition-colors hover:bg-brand-50/50',
  trPending: 'bg-amber-50/30 hover:bg-amber-50/50',
  trOverdue: 'bg-red-50/20 hover:bg-red-50/35',
  td: 'px-6 py-4 align-middle',
  tdFirst: 'px-6 py-4 align-middle md:px-8',
  tdLast: 'px-6 py-4 text-right align-middle md:px-8',
  tdMuted: 'px-6 py-4 text-muted align-middle',
  namePrimary: 'font-medium text-foreground',
  nameSecondary: 'truncate text-xs text-muted',
  amountPrimary: 'font-semibold tabular-nums text-foreground',
  amountSecondary: 'mt-0.5 truncate text-xs text-muted',
  missingText: 'text-sm text-muted',
  rowChevron: 'h-4 w-4 text-muted opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100',
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
