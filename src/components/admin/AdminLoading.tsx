import { Loading, LoadingSkeleton } from '@/components/ui/Loading'

export function AdminContentLoader({
  label = 'កំពុងផ្ទុក...',
  className = '',
}: {
  label?: string
  className?: string
}) {
  return (
    <div
      className={`flex min-h-[40vh] flex-1 items-center justify-center py-16 ${className}`.trim()}
      aria-busy="true"
      aria-live="polite"
    >
      <Loading size="lg" label={label} />
    </div>
  )
}

export function AdminListLoading({
  label = 'កំពុងផ្ទុក...',
  rows = 8,
}: {
  label?: string
  rows?: number
}) {
  return (
    <div className="flex min-h-[40vh] flex-1 flex-col gap-4" aria-busy="true" aria-live="polite">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <LoadingSkeleton className="h-10 w-full max-w-md rounded-lg" />
        <LoadingSkeleton className="h-10 w-36 rounded-lg" />
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        <LoadingSkeleton className="h-11 w-full rounded-none" />
        <div className="divide-y divide-border">
          {Array.from({ length: rows }).map((_, index) => (
            <div key={index} className="flex items-center gap-4 px-5 py-4">
              <LoadingSkeleton className="h-4 w-32 shrink-0" />
              <LoadingSkeleton className="h-4 w-24" />
              <LoadingSkeleton className="hidden h-4 w-20 sm:block" />
              <LoadingSkeleton className="ml-auto h-6 w-16 rounded-full" />
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-center pt-2">
        <Loading size="md" label={label} />
      </div>
    </div>
  )
}

export function AdminDashboardLoading({ label = 'កំពុងផ្ទុក...' }: { label?: string }) {
  return (
    <div className="flex min-h-[40vh] flex-1 flex-col gap-6" aria-busy="true" aria-live="polite">
      <LoadingSkeleton className="h-10 w-full max-w-3xl rounded-xl" />
      <div className="grid gap-4 lg:grid-cols-2">
        <LoadingSkeleton className="h-64 rounded-xl" />
        <LoadingSkeleton className="h-64 rounded-xl" />
      </div>
      <LoadingSkeleton className="h-72 rounded-xl" />
      <div className="flex justify-center">
        <Loading size="md" label={label} />
      </div>
    </div>
  )
}
