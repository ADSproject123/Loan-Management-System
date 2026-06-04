'use client'

import { Search } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Select, type SelectOption } from '@/components/ui/Select'

export const adminFieldClassName =
  'w-full border border-border bg-surface text-sm text-foreground shadow-xs outline-none ring-0 transition placeholder:text-muted focus:border-border focus:shadow-xs focus:outline-none focus:ring-0 focus-visible:border-border focus-visible:shadow-xs focus-visible:outline-none focus-visible:ring-0'

export type { SelectOption }

type AdminListToolbarProps = {
  searchValue: string
  onSearchChange: (value: string) => void
  searchPlaceholder: string
  selectLabel?: string
  selectId?: string
  selectValue?: string
  onSelectChange?: (value: string) => void
  selectOptions?: SelectOption[]
  showClear: boolean
  onClear: () => void
  filterSummary?: React.ReactNode
  extra?: React.ReactNode
}

export function AdminListToolbar({
  searchValue,
  onSearchChange,
  searchPlaceholder,
  selectLabel,
  selectId = 'admin-list-filter',
  selectValue,
  onSelectChange,
  selectOptions,
  showClear,
  onClear,
  filterSummary,
  extra,
}: AdminListToolbarProps) {
  return (
    <div className="border-b border-border px-6 py-4 md:px-8">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-end">
        <div className="relative min-w-0 flex-1 xl:max-w-md">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            type="text"
            inputMode="search"
            enterKeyHint="search"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={searchPlaceholder}
            className={`${adminFieldClassName} py-2.5 pl-10 pr-4`}
          />
        </div>

        {extra}

        {selectOptions && onSelectChange && selectValue !== undefined && (
          <div className="min-w-44">
            {selectLabel && (
              <label htmlFor={selectId} className="mb-1 block text-xs font-semibold text-muted">
                {selectLabel}
              </label>
            )}
            <Select
              id={selectId}
              value={selectValue}
              onChange={onSelectChange}
              options={selectOptions}
              aria-label={selectLabel}
            />
          </div>
        )}

        {showClear && (
          <Button type="button" variant="outline" size="sm" onClick={onClear} className="xl:mb-0">
            លុបចម្រោះ
          </Button>
        )}

        {showClear && filterSummary && (
          <p className="text-sm text-muted xl:ml-auto xl:shrink-0">{filterSummary}</p>
        )}
      </div>
    </div>
  )
}
