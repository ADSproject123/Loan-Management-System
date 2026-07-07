import React from 'react'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { dataTable, tableContainer, tableScroll } from '@/components/ui/tableStyles'
import type { LucideIcon } from 'lucide-react'

export type StatsRow = {
  icon: LucideIcon
  iconClass: string
  label: string
  value: string
  meta?: string | null
  metaClass?: string
  href?: string | null
  linkLabel?: string | null
}

interface StatsTableProps {
  rows: StatsRow[]
  className?: string
}

export function StatsTable({ rows, className = '' }: StatsTableProps) {
  return (
    <div className={`${tableContainer} ${className}`}>
      <div className={tableScroll}>
        <table className={dataTable.table}>
          <thead className={dataTable.thead}>
            <tr className={dataTable.thRow}>
              <th className={dataTable.th}>ប្រភេទ</th>
              <th className={dataTable.th}>ចំនួនទឹកប្រាក់</th>
              <th className={dataTable.th}>ព័ត៌មានបន្ថែម</th>
            </tr>
          </thead>
          <tbody className={dataTable.tbody}>
            {rows.map((row) => {
              const Icon = row.icon
              return (
                <tr key={row.label} className={dataTable.tr}>
                  <td className={dataTable.td}>
                    <div className="flex items-center gap-3">
                      <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${row.iconClass}`}>
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="font-medium text-foreground">{row.label}</span>
                    </div>
                  </td>
                  <td className={`${dataTable.td} font-bold tabular-nums`}>{row.value}</td>
                  <td className={dataTable.tdMuted}>
                    {row.meta ? (
                      <span className={row.metaClass}>{row.meta}</span>
                    ) : row.href && row.linkLabel ? (
                      <Link
                        href={row.href}
                        className="inline-flex items-center gap-1 text-xs font-medium text-brand-700 transition hover:text-brand-900"
                      >
                        {row.linkLabel}
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Link>
                    ) : (
                      '—'
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
