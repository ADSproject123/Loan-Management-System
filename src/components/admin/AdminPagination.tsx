'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import {
  ADMIN_PAGE_SIZE_OPTIONS,
  buildAdminPaginationHref,
  getPaginationItems,
  getPaginationItemsPartial,
  type AdminPageSize,
} from '@/lib/admin/pagination'
import { Select } from '@/components/ui/Select'

type AdminPaginationProps = {
  basePath: string
  page: number
  pageSize: AdminPageSize
  hasPrev: boolean
  hasNext: boolean
  totalCount?: number | null
  query?: Record<string, string | undefined>
  showPageSize?: boolean
  showGoToPage?: boolean
}

function NavButton({
  href,
  disabled,
  label,
  children,
}: {
  href: string
  disabled: boolean
  label: string
  children: React.ReactNode
}) {
  const className =
    'inline-flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full text-muted transition hover:bg-brand-50 hover:text-brand-700 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-muted'

  if (disabled) {
    return (
      <span aria-disabled="true" className={className}>
        {children}
      </span>
    )
  }

  return (
    <Link href={href} aria-label={label} className={className}>
      {children}
    </Link>
  )
}

function PageLink({
  href,
  page,
  isActive,
}: {
  href: string
  page: number
  isActive: boolean
}) {
  return (
    <Link
      href={href}
      aria-label={`ទំព័រ ${page}`}
      aria-current={isActive ? 'page' : undefined}
      className={`inline-flex h-9 min-w-9 cursor-pointer items-center justify-center rounded-full px-2 text-sm font-semibold transition ${
        isActive
          ? 'border border-brand-200 bg-brand-50 text-brand-700 shadow-xs ring-1 ring-brand-100'
          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
      }`}
    >
      {page}
    </Link>
  )
}

export function AdminPagination({
  basePath,
  page,
  pageSize,
  hasPrev,
  hasNext,
  totalCount,
  query,
  showPageSize = true,
  showGoToPage = true,
}: AdminPaginationProps) {
  const router = useRouter()
  const [goToValue, setGoToValue] = useState('')

  const totalPages =
    totalCount != null && totalCount > 0
      ? Math.max(1, Math.ceil(totalCount / pageSize))
      : undefined

  const pageItems =
    totalPages != null
      ? getPaginationItems(page, totalPages)
      : getPaginationItemsPartial(page, hasNext)

  const hrefFor = (targetPage: number) =>
    buildAdminPaginationHref(basePath, targetPage, pageSize, query)

  const prevHref = hrefFor(page - 1)
  const nextHref = hrefFor(page + 1)

  function onPageSizeChange(nextSize: string) {
    const size = Number(nextSize) as AdminPageSize
    router.push(buildAdminPaginationHref(basePath, 1, size, query))
  }

  function onGoToPage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const target = Math.max(1, Number(goToValue) || 1)
    const capped =
      totalPages != null ? Math.min(target, totalPages) : target
    router.push(hrefFor(capped))
    setGoToValue('')
  }

  if (!hasPrev && !hasNext && page === 1 && pageItems.length <= 1) {
    return null
  }

  return (
    <nav
      className="flex flex-col items-center gap-3 sm:flex-row sm:flex-wrap sm:justify-center"
      aria-label="ទំព័រ"
    >
      <div className="inline-flex max-w-full flex-wrap items-center justify-center gap-0.5 rounded-full border border-border bg-surface px-2 py-1.5 shadow-sm">
        <NavButton href={prevHref} disabled={!hasPrev} label="ទំព័រមុន">
          <ChevronLeft className="h-4 w-4" strokeWidth={2.25} />
        </NavButton>

        {pageItems.map((item, index) =>
          item === 'ellipsis' ? (
            <span
              key={`ellipsis-${index}`}
              className="inline-flex h-9 min-w-8 items-center justify-center px-1 text-sm font-medium text-muted"
              aria-hidden
            >
              …
            </span>
          ) : (
            <PageLink
              key={item}
              href={hrefFor(item)}
              page={item}
              isActive={item === page}
            />
          )
        )}

        <NavButton href={nextHref} disabled={!hasNext} label="ទំព័របន្ទាប់">
          <ChevronRight className="h-4 w-4" strokeWidth={2.25} />
        </NavButton>

        {showPageSize && (
          <>
            <span className="mx-1 hidden h-6 w-px bg-border sm:inline" aria-hidden />
            <Select
              value={String(pageSize)}
              onChange={onPageSizeChange}
              aria-label="ចំនួនក្នុងមួយទំព័រ"
              className="min-w-[7.5rem]"
              triggerClassName="flex h-9 cursor-pointer items-center justify-between gap-1 rounded-full border-0 bg-surface-muted/80 px-3 text-sm font-medium text-slate-700 shadow-none outline-none transition hover:bg-surface-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-200"
              menuClassName="min-w-[7.5rem]"
              options={ADMIN_PAGE_SIZE_OPTIONS.map((size) => ({
                value: String(size),
                label: `${size} / ទំព័រ`,
              }))}
            />
          </>
        )}
      </div>

      {showGoToPage && (
        <form
          onSubmit={onGoToPage}
          className="inline-flex items-center gap-2 text-sm text-muted"
        >
          <label htmlFor={`goto-${basePath}`} className="shrink-0 font-medium">
            ទៅ
          </label>
          <input
            id={`goto-${basePath}`}
            type="number"
            min={1}
            max={totalPages}
            value={goToValue}
            onChange={(event) => setGoToValue(event.target.value)}
            placeholder={String(page)}
            className="h-9 w-14 rounded-full border border-border bg-surface px-2 text-center text-sm font-semibold text-foreground shadow-xs outline-none transition focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
          />
          <span className="shrink-0 font-medium">ទំព័រ</span>
        </form>
      )}
    </nav>
  )
}
