'use client'

import { Search } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export const adminFieldClassName =
  'w-full border border-gray-200 bg-white text-sm text-gray-900 shadow-xs outline-none transition placeholder:text-gray-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-500/15'

type SelectOption = { value: string; label: string }

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
    <div className="border-b border-gray-100 px-6 py-4 md:px-8">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-end">
        <div className="relative min-w-0 flex-1 xl:max-w-md">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="search"
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
              <label htmlFor={selectId} className="mb-1 block text-xs font-semibold text-gray-500">
                {selectLabel}
              </label>
            )}
            <select
              id={selectId}
              value={selectValue}
              onChange={(e) => onSelectChange(e.target.value)}
              className={`${adminFieldClassName} px-3 py-2.5`}
            >
              {selectOptions.map((opt) => (
                <option key={opt.value || 'all'} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {showClear && (
          <Button type="button" variant="outline" size="sm" onClick={onClear} className="xl:mb-0">
            លុបចម្រោះ
          </Button>
        )}

        {showClear && filterSummary && (
          <p className="text-sm text-gray-500 xl:ml-auto xl:shrink-0">{filterSummary}</p>
        )}
      </div>
    </div>
  )
}
