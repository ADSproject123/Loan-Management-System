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
          className="cursor-pointer rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
        >
          មុន
        </Link>
      ) : (
        <span className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-400">
          មុន
        </span>
      )}

      <span className="text-sm font-semibold text-slate-600">ទំព័រ {page}</span>

      {hasNext ? (
        <Link
          href={nextHref}
          className="cursor-pointer rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
        >
          បន្ទាប់
        </Link>
      ) : (
        <span className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-400">
          បន្ទាប់
        </span>
      )}
    </div>
  )
}
