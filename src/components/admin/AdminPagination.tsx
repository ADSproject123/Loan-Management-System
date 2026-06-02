import Link from 'next/link'

type AdminPaginationProps = {
  basePath: string
  page: number
  hasPrev: boolean
  hasNext: boolean
}

export function AdminPagination({ basePath, page, hasPrev, hasNext }: AdminPaginationProps) {
  const prevHref = `${basePath}?page=${page - 1}`
  const nextHref = `${basePath}?page=${page + 1}`

  return (
    <div className="flex items-center justify-between gap-3">
      {hasPrev ? (
        <Link
          href={prevHref}
          className="border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
        >
          មុន
        </Link>
      ) : (
        <span className="border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-semibold text-gray-400">
          មុន
        </span>
      )}

      <span className="text-sm font-semibold text-gray-600">ទំព័រ {page}</span>

      {hasNext ? (
        <Link
          href={nextHref}
          className="border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
        >
          បន្ទាប់
        </Link>
      ) : (
        <span className="border border-gray-200 bg-gray-50 px-4 py-2 text-sm font-semibold text-gray-400">
          បន្ទាប់
        </span>
      )}
    </div>
  )
}
