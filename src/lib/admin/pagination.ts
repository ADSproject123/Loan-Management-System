export const ADMIN_PAGE_SIZE_OPTIONS = [10, 15, 20, 30] as const
export type AdminPageSize = (typeof ADMIN_PAGE_SIZE_OPTIONS)[number]

export function parseAdminPageSize(
  value: string | undefined,
  fallback: AdminPageSize = 15
): AdminPageSize {
  const n = Number(value)
  return ADMIN_PAGE_SIZE_OPTIONS.includes(n as AdminPageSize) ? (n as AdminPageSize) : fallback
}

export function parseAdminListParams(
  params: { page?: string; size?: string } | null | undefined,
  options?: { defaultPageSize?: AdminPageSize }
) {
  const defaultPageSize = options?.defaultPageSize ?? 15
  const pageSize = parseAdminPageSize(params?.size, defaultPageSize)
  const page =
    typeof params?.page === 'string' ? Math.max(1, Number(params.page) || 1) : 1
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  return { page, pageSize, from, to }
}

export function adminTotalPages(totalCount: number | null | undefined, pageSize: number) {
  if (totalCount == null || totalCount <= 0) return undefined
  return Math.max(1, Math.ceil(totalCount / pageSize))
}

export function buildAdminPaginationQuery(
  page: number,
  pageSize: number,
  extra?: Record<string, string | undefined>
) {
  const params = new URLSearchParams()
  params.set('page', String(page))
  params.set('size', String(pageSize))
  if (extra) {
    for (const [key, value] of Object.entries(extra)) {
      if (value) params.set(key, value)
    }
  }
  return params.toString()
}

export function buildAdminPaginationHref(
  basePath: string,
  page: number,
  pageSize: number,
  extra?: Record<string, string | undefined>
) {
  const query = buildAdminPaginationQuery(page, pageSize, extra)
  return `${basePath}?${query}`
}

/** Page numbers with ellipsis (e.g. 1 2 3 … 30). */
export function getPaginationItems(
  currentPage: number,
  totalPages: number
): (number | 'ellipsis')[] {
  if (totalPages <= 1) return totalPages === 1 ? [1] : []

  const delta = 1
  const items: (number | 'ellipsis')[] = []
  let previous: number | undefined

  for (let page = 1; page <= totalPages; page += 1) {
    const isEdge = page === 1 || page === totalPages
    const isNearCurrent = page >= currentPage - delta && page <= currentPage + delta
    if (!isEdge && !isNearCurrent) continue

    if (previous !== undefined) {
      if (page - previous === 2) items.push(previous + 1)
      else if (page - previous > 2) items.push('ellipsis')
    }

    items.push(page)
    previous = page
  }

  return items
}

/** When total pages are unknown, show a window around the current page. */
export function getPaginationItemsPartial(
  currentPage: number,
  hasNext: boolean
): (number | 'ellipsis')[] {
  const estimatedLast = hasNext ? currentPage + 1 : currentPage
  return getPaginationItems(currentPage, Math.max(currentPage, estimatedLast))
}
