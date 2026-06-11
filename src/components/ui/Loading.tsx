import React from 'react'

const spinnerSizes = {
  xs: 'h-3 w-3',
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
  xl: 'h-10 w-10',
} as const

const spinnerColors = {
  current: 'text-current',
  brand: 'text-brand-600',
  white: 'text-white',
  muted: 'text-muted',
} as const

export type LoadingSize = keyof typeof spinnerSizes
export type LoadingColor = keyof typeof spinnerColors

interface LoadingSpinnerProps {
  size?: LoadingSize
  color?: LoadingColor
  className?: string
}

export function LoadingSpinner({
  size = 'sm',
  color = 'current',
  className = '',
}: LoadingSpinnerProps) {
  return (
    <svg
      className={`animate-spin ${spinnerSizes[size]} ${spinnerColors[color]} ${className}`.trim()}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  )
}

interface LoadingProps {
  size?: LoadingSize
  label?: string
  className?: string
  labelClassName?: string
}

export function Loading({
  size = 'md',
  label,
  className = '',
  labelClassName = '',
}: LoadingProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 ${className}`.trim()}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <LoadingSpinner size={size} color="brand" />
      {label ? (
        <p className={`text-sm font-medium text-muted ${labelClassName}`.trim()}>{label}</p>
      ) : null}
      <span className="sr-only">{label ?? 'កំពុងផ្ទុក'}</span>
    </div>
  )
}

interface LoadingDotsProps {
  size?: LoadingSize
  color?: LoadingColor
  className?: string
}

const dotSizes: Record<LoadingSize, string> = {
  xs: 'h-1 w-1',
  sm: 'h-1.5 w-1.5',
  md: 'h-2 w-2',
  lg: 'h-2.5 w-2.5',
  xl: 'h-3 w-3',
}

export function LoadingDots({
  size = 'sm',
  color = 'brand',
  className = '',
}: LoadingDotsProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 ${className}`.trim()}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      {[0, 1, 2].map((index) => (
        <span
          key={index}
          className={`animate-bounce rounded-full ${dotSizes[size]} ${spinnerColors[color]} bg-current`}
          style={{ animationDelay: `${index * 150}ms` }}
        />
      ))}
      <span className="sr-only">កំពុងផ្ទុក</span>
    </span>
  )
}

interface LoadingOverlayProps {
  loading: boolean
  children: React.ReactNode
  label?: string
  className?: string
  blur?: boolean
}

export function LoadingOverlay({
  loading,
  children,
  label,
  className = '',
  blur = true,
}: LoadingOverlayProps) {
  return (
    <div className={`relative ${className}`.trim()}>
      {children}
      {loading ? (
        <div
          className={`absolute inset-0 z-10 flex items-center justify-center rounded-[inherit] ${
            blur ? 'bg-white/75 backdrop-blur-[2px]' : 'bg-white/85'
          }`}
          aria-busy="true"
        >
          <Loading size="md" label={label} />
        </div>
      ) : null}
    </div>
  )
}

interface LoadingGateProps {
  loading: boolean
  children: React.ReactNode
  fallback?: React.ReactNode
  label?: string
  className?: string
}

export function LoadingGate({
  loading,
  children,
  fallback,
  label = 'កំពុងផ្ទុក...',
  className = '',
}: LoadingGateProps) {
  if (loading) {
    return (
      fallback ?? (
        <div className={className}>
          <Loading className="py-16" size="lg" label={label} />
        </div>
      )
    )
  }

  return <>{children}</>
}

interface LoadingSkeletonProps {
  className?: string
}

export function LoadingSkeleton({ className = '' }: LoadingSkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded-md bg-slate-200/80 ${className}`.trim()}
      aria-hidden
    />
  )
}

interface LoadingPageSkeletonProps {
  className?: string
  statCount?: number
  rowCount?: number
}

export function LoadingPageSkeleton({
  className = '',
  statCount = 4,
  rowCount = 5,
}: LoadingPageSkeletonProps) {
  return (
    <div className={`mx-auto max-w-7xl p-6 md:p-10 ${className}`.trim()} aria-busy="true" aria-live="polite">
      <div className="mb-8 space-y-3">
        <LoadingSkeleton className="h-3 w-32" />
        <LoadingSkeleton className="h-8 w-64 rounded-lg" />
        <LoadingSkeleton className="h-4 w-48" />
      </div>

      <div className="mb-8 grid grid-cols-2 gap-4 md:gap-6 lg:grid-cols-4">
        {Array.from({ length: statCount }).map((_, index) => (
          <div key={index} className="rounded-2xl border border-slate-200 bg-white p-6">
            <LoadingSkeleton className="mb-3 h-10 w-10 rounded-lg" />
            <LoadingSkeleton className="mb-2 h-7 w-24" />
            <LoadingSkeleton className="h-4 w-20" />
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-6 py-4">
          <LoadingSkeleton className="h-5 w-40" />
        </div>
        <div className="divide-y divide-slate-100">
          {Array.from({ length: rowCount }).map((_, index) => (
            <div key={index} className="flex items-center gap-4 px-6 py-4">
              <LoadingSkeleton className="h-10 w-10 shrink-0 rounded-lg" />
              <div className="flex-1 space-y-2">
                <LoadingSkeleton className="h-4 w-48" />
                <LoadingSkeleton className="h-3 w-32" />
              </div>
              <LoadingSkeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

interface PageLoaderProps {
  label?: string
  className?: string
}

export function PageLoader({
  label = 'កំពុងផ្ទុក...',
  className = '',
}: PageLoaderProps) {
  return (
    <div className={`flex min-h-[50vh] items-center justify-center p-6 ${className}`.trim()}>
      <Loading size="lg" label={label} />
    </div>
  )
}
