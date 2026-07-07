/** Outer frame: rounded border, clips inner scroll content. */
export const tableContainer =
  'flex min-h-0 flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-sm ring-1 ring-foreground/5'

/** Same frame but grows inside flex layouts (admin lists). */
export const tableContainerFill = `${tableContainer} flex-1`

/** Scroll layer — keeps header flush with container edges. */
export const tableScroll = 'min-h-0 flex-1 overflow-auto'

export const dataTable = {
  table: 'w-full min-w-0 border-collapse text-left text-sm',
  thead: 'sticky top-0 z-10 border-b border-border bg-surface-muted',
  thRow: '',
  th: 'px-5 py-3 text-left text-sm font-normal uppercase tracking-wide text-foreground whitespace-nowrap font-heading md:px-6',
  thRight:
    'px-5 py-3 text-right text-sm font-normal uppercase tracking-wide text-foreground whitespace-nowrap font-heading md:px-6',
  tbody: 'divide-y divide-border bg-surface',
  tr: 'bg-surface transition-colors hover:bg-surface-muted/50',
  td: 'px-5 py-3.5 align-middle text-foreground md:px-6',
  tdMuted: 'px-5 py-3.5 align-middle text-foreground md:px-6',
  tdRight: 'px-5 py-3.5 text-right align-middle text-foreground md:px-6',
  tfoot: 'border-t border-border bg-surface-muted',
  sectionHeader: 'shrink-0 border-b border-border bg-surface-muted px-5 py-3.5 md:px-6',
  sectionTitle: 'font-heading text-sm font-semibold text-foreground',
  emptyCell: 'px-5 py-12 text-center text-sm text-foreground md:px-6',
} as const
