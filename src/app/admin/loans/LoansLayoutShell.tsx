'use client'

import { usePathname } from 'next/navigation'
import { AdminPanel } from '@/components/admin'
import { LoansTabs } from '@/app/admin/loans/LoansTabs'

const LOAN_SECTION_SEGMENTS = new Set(['requests', 'active', 'payments'])

function isLoanDetailPath(pathname: string) {
  if (!pathname.startsWith('/admin/loans/')) return false
  const segment = pathname.slice('/admin/loans/'.length).split('/')[0]
  return Boolean(segment) && !LOAN_SECTION_SEGMENTS.has(segment)
}

export function LoansLayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  if (isLoanDetailPath(pathname)) {
    return <>{children}</>
  }

  return (
    <main className="flex min-h-screen flex-col">
      <AdminPanel>
        <div className="flex min-h-0 flex-1 flex-col gap-6 px-6 py-6 md:px-8">
          <LoansTabs />
          <div className="flex min-h-0 flex-1 flex-col">{children}</div>
        </div>
      </AdminPanel>
    </main>
  )
}
