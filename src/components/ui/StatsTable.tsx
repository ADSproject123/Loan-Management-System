import React from 'react'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { Card } from '@/components/ui/Card'
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
    <Card padding="none" className={`overflow-hidden ${className}`}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                ប្រភេទ
              </th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                ចំនួនទឹកប្រាក់
              </th>
              <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                ព័ត៌មានបន្ថែម
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((row) => {
              const Icon = row.icon
              return (
                <tr key={row.label} className="transition-colors hover:bg-gray-50/80">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${row.iconClass}`}>
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="font-medium text-gray-900">{row.label}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 font-bold tabular-nums text-gray-900">{row.value}</td>
                  <td className="px-5 py-4 text-gray-600">
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
    </Card>
  )
}
