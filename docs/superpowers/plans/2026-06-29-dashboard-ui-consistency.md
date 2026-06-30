# Dashboard UI Consistency Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make dashboard pages consistent by extracting reusable components (PageHeader, StatsTable, AlertBanner, LinkButton) and shared utilities (toNumber), then rewrite the loans and savings pages to match the main dashboard's table-stats layout.

**Architecture:** Extract 3 new UI components + extend Button with href support. Move duplicated `toNumber` to shared lib. Rewrite loans/savings pages to use StatsTable pattern. Refactor main dashboard to use shared components. Clean up inline-styled links across dashboard forms.

**Tech Stack:** Next.js (App Router), React server components, Tailwind CSS, Lucide icons, TypeScript

---

## File Structure

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `src/lib/utils.ts` | Shared `toNumber` utility |
| Create | `src/components/ui/PageHeader.tsx` | Reusable page header with title + subtitle + action slot |
| Create | `src/components/ui/StatsTable.tsx` | Table-based stats rows inside a Card |
| Create | `src/components/ui/AlertBanner.tsx` | Warning/info banner with icon |
| Modify | `src/components/ui/Button.tsx` | Add `href` prop to render as `<Link>` |
| Modify | `src/lib/dates.ts` | Add `formatKhmerMonthYear` for month+year format |
| Modify | `src/app/dashboard/loans/page.tsx` | Full rewrite using new components |
| Modify | `src/app/dashboard/savings/page.tsx` | Full rewrite using new components |
| Modify | `src/app/dashboard/page.tsx` | Refactor to use StatsTable, AlertBanner, LinkButton |
| Modify | `src/app/dashboard/loans/request/LoanRequestForm.tsx` | Replace inline-styled links with LinkButton |
| Modify | `src/app/dashboard/loans/repay/LoanRepayForm.tsx` | Replace inline-styled links with LinkButton |
| Modify | `src/app/dashboard/capital/CapitalRequestForm.tsx` | Replace inline-styled link with LinkButton |
| Modify | `src/app/dashboard/capital/page.tsx` | Use shared `toNumber` |
| Modify | `src/app/dashboard/loans/repay/getRepayContext.ts` | Use shared `toNumber` |
| Modify | `src/lib/loanEligibility.ts` | Use shared `toNumber` |

---

### Task 1: Extract `toNumber` to shared utility

**Files:**
- Create: `src/lib/utils.ts`
- Modify: `src/app/dashboard/page.tsx:21-24`
- Modify: `src/app/dashboard/loans/page.tsx:11-14`
- Modify: `src/app/dashboard/savings/page.tsx:10-13`
- Modify: `src/app/dashboard/capital/page.tsx:9-12`
- Modify: `src/app/dashboard/loans/repay/getRepayContext.ts:15-18`
- Modify: `src/lib/loanEligibility.ts:26-29`

- [ ] **Step 1: Create `src/lib/utils.ts`**

```ts
export function toNumber(value: unknown) {
  const numberValue = Number(value ?? 0)
  return Number.isFinite(numberValue) ? numberValue : 0
}
```

- [ ] **Step 2: Update all 6 consumer files**

In each file, remove the local `toNumber` function and add an import:

```ts
import { toNumber } from '@/lib/utils'
```

Files to update:
1. `src/app/dashboard/page.tsx` — remove lines 21-24, add import
2. `src/app/dashboard/loans/page.tsx` — remove lines 11-14, add import
3. `src/app/dashboard/savings/page.tsx` — remove lines 10-13, add import
4. `src/app/dashboard/capital/page.tsx` — remove lines 9-12, add import
5. `src/app/dashboard/loans/repay/getRepayContext.ts` — remove lines 15-18, add import
6. `src/lib/loanEligibility.ts` — remove lines 26-29, add import

- [ ] **Step 3: Verify build**

Run: `npx next build`
Expected: Build succeeds with no errors.

- [ ] **Step 4: Commit**

```bash
git add src/lib/utils.ts src/app/dashboard/page.tsx src/app/dashboard/loans/page.tsx src/app/dashboard/savings/page.tsx src/app/dashboard/capital/page.tsx src/app/dashboard/loans/repay/getRepayContext.ts src/lib/loanEligibility.ts
git commit -m "refactor: extract shared toNumber utility to src/lib/utils.ts"
```

---

### Task 2: Add `formatKhmerDateShort` to dates.ts

**Files:**
- Modify: `src/lib/dates.ts`

The existing `formatKhmerDate` produces "29 មិថុនា 2026" (day + full month + year). The dashboard and savings table also need a short format like "29 មិថុនា 2026" (same) and a month+year only format like "មិថុនា 2026". Add helpers for these patterns so inline `toLocaleDateString` calls can be replaced.

- [ ] **Step 1: Add date formatting helpers to `src/lib/dates.ts`**

Add after the existing `formatKhmerDate` function (after line 69):

```ts
/** "មិថុនា 2026" — month + year only. */
export function formatKhmerMonthYear(value?: string | null, fallback = 'មិនកំណត់') {
  if (!value) return fallback
  const parts = parseDateParts(value)
  if (!parts) return fallback
  return `${KHMER_MONTHS[parts.month - 1]} ${parts.year}`
}
```

- [ ] **Step 2: Verify build**

Run: `npx next build`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/lib/dates.ts
git commit -m "feat: add formatKhmerMonthYear helper to dates.ts"
```

---

### Task 3: Create `PageHeader` component

**Files:**
- Create: `src/components/ui/PageHeader.tsx`

- [ ] **Step 1: Create `src/components/ui/PageHeader.tsx`**

```tsx
import React from 'react'

interface PageHeaderProps {
  title: string
  subtitle: string
  children?: React.ReactNode
}

export function PageHeader({ title, subtitle, children }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{title}</h1>
        <p className="text-gray-500 text-sm mt-1">{subtitle}</p>
      </div>
      {children && <div className="flex gap-3">{children}</div>}
    </div>
  )
}
```

- [ ] **Step 2: Verify build**

Run: `npx next build`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/PageHeader.tsx
git commit -m "feat: add reusable PageHeader component"
```

---

### Task 4: Create `StatsTable` component

**Files:**
- Create: `src/components/ui/StatsTable.tsx`

- [ ] **Step 1: Create `src/components/ui/StatsTable.tsx`**

Match the exact styling from the main dashboard's inline stats table (`src/app/dashboard/page.tsx:172-223`):

```tsx
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
```

- [ ] **Step 2: Verify build**

Run: `npx next build`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/StatsTable.tsx
git commit -m "feat: add reusable StatsTable component"
```

---

### Task 5: Create `AlertBanner` component

**Files:**
- Create: `src/components/ui/AlertBanner.tsx`

- [ ] **Step 1: Create `src/components/ui/AlertBanner.tsx`**

```tsx
import React from 'react'
import { AlertTriangle, Info } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

type AlertVariant = 'warning' | 'info'

interface AlertBannerProps {
  variant?: AlertVariant
  icon?: LucideIcon
  children: React.ReactNode
  className?: string
}

const variantStyles: Record<AlertVariant, { container: string; icon: string }> = {
  warning: {
    container: 'border-amber-200 bg-amber-50',
    icon: 'text-amber-600',
  },
  info: {
    container: 'border-yellow-200 bg-yellow-50',
    icon: 'text-yellow-600',
  },
}

const defaultIcons: Record<AlertVariant, LucideIcon> = {
  warning: AlertTriangle,
  info: AlertTriangle,
}

export function AlertBanner({ variant = 'warning', icon, children, className = '' }: AlertBannerProps) {
  const styles = variantStyles[variant]
  const Icon = icon ?? defaultIcons[variant]

  return (
    <div className={`flex items-start gap-3 rounded-xl border p-4 ${styles.container} ${className}`}>
      <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${styles.icon}`} />
      <div className="text-sm">{children}</div>
    </div>
  )
}
```

- [ ] **Step 2: Verify build**

Run: `npx next build`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/AlertBanner.tsx
git commit -m "feat: add reusable AlertBanner component"
```

---

### Task 6: Extend `Button` with `href` prop (LinkButton)

**Files:**
- Modify: `src/components/ui/Button.tsx`

- [ ] **Step 1: Rewrite `src/components/ui/Button.tsx` to support `href`**

When `href` is provided, render as a Next.js `<Link>` with the same styling. Keep `'use client'` since the loading state needs it.

```tsx
'use client'

import React from 'react'
import Link from 'next/link'
import { LoadingSpinner } from '@/components/ui/Loading'

const baseClasses =
  'inline-flex cursor-pointer items-center justify-center font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed'

const variantClasses = {
  primary: 'bg-brand-950 text-white hover:bg-brand-900 focus:ring-brand-500 active:bg-brand-950',
  secondary: 'bg-brand-100 text-brand-900 hover:bg-brand-200 focus:ring-brand-500',
  outline: 'bg-surface border-2 border-brand-950 text-brand-900 hover:bg-brand-50 focus:ring-brand-500',
  ghost: 'bg-surface-muted text-brand-900 hover:bg-brand-50 focus:ring-brand-500',
  danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
}

const sizeClasses = {
  sm: 'text-sm px-3 py-1.5 gap-1.5',
  md: 'text-sm px-4 py-2.5 gap-2',
  lg: 'text-base px-6 py-3 gap-2',
}

interface ButtonBaseProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
  className?: string
}

interface ButtonAsButton extends ButtonBaseProps, Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, keyof ButtonBaseProps> {
  href?: never
  loading?: boolean
}

interface ButtonAsLink extends ButtonBaseProps {
  href: string
  loading?: never
  disabled?: never
}

type ButtonProps = ButtonAsButton | ButtonAsLink

export function Button(props: ButtonProps) {
  const { variant = 'primary', size = 'md', children, className = '' } = props
  const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`

  if (props.href) {
    return (
      <Link href={props.href} className={classes}>
        {children}
      </Link>
    )
  }

  const { loading = false, disabled, href: _, ...rest } = props as ButtonAsButton
  return (
    <button
      className={classes}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? <LoadingSpinner size="sm" color="current" /> : null}
      {children}
    </button>
  )
}
```

- [ ] **Step 2: Verify build**

Run: `npx next build`
Expected: Build succeeds. All existing Button usage still works because the API is backward-compatible.

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/Button.tsx
git commit -m "feat: extend Button component to support href prop as Link"
```

---

### Task 7: Rewrite `/dashboard/loans/page.tsx`

**Files:**
- Modify: `src/app/dashboard/loans/page.tsx`

- [ ] **Step 1: Rewrite the loans page**

Replace the entire file content with:

```tsx
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { LoanStatusBadge } from '@/components/ui/Badge'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatsTable, type StatsRow } from '@/components/ui/StatsTable'
import { AlertBanner } from '@/components/ui/AlertBanner'
import { Button } from '@/components/ui/Button'
import { requireMember } from '@/lib/auth/member'
import { createAdminClient } from '@/lib/supabase/admin'
import { formatMoney, normalizeCurrency } from '@/lib/currency'
import { formatKhmerDate } from '@/lib/dates'
import { getInterestSettings, loanRepaymentSummary, resolveLoanInterestRate } from '@/lib/interest'
import { getLoanEligibility, sumCommittedLoanPrincipal, sumVerifiedSavings } from '@/lib/loanEligibility'
import { toNumber } from '@/lib/utils'
import { CreditCard, Plus, FileText, AlertTriangle, ArrowRight } from 'lucide-react'

export default async function LoansPage() {
  const member = await requireMember()
  const admin = createAdminClient()
  const [loansResult, repaymentsResult, savingsResult] = await Promise.all([
    admin
      .from('loans')
      .select('id, amount, currency, purpose, term_months, monthly_interest_rate, status, disbursed_at, due_date, created_at')
      .eq('member_id', member.id)
      .order('created_at', { ascending: false }),
    admin
      .from('loan_repayments')
      .select('loan_id, amount, status')
      .eq('member_id', member.id),
    admin
      .from('savings')
      .select('amount, status, verified_at, verified_by')
      .eq('member_id', member.id),
  ])

  const interestSettings = await getInterestSettings()
  const loans = loansResult.data ?? []
  const repayments = repaymentsResult.data ?? []
  const paidByLoan = new Map<string, number>()

  repayments
    .filter((repayment) => repayment.status === 'verified' || repayment.status === 'completed')
    .forEach((repayment) => {
      paidByLoan.set(
        repayment.loan_id,
        (paidByLoan.get(repayment.loan_id) ?? 0) + toNumber(repayment.amount)
      )
    })

  const activeLoan = loans.find((loan) => loan.status === 'active')
  const activeLoanPaid = activeLoan ? paidByLoan.get(activeLoan.id) ?? 0 : 0
  const activeLoanPrincipal = activeLoan ? toNumber(activeLoan.amount) : 0
  const activeLoanTerm = activeLoan ? toNumber(activeLoan.term_months) || 12 : 12
  const activeLoanRate = activeLoan
    ? resolveLoanInterestRate(activeLoan, interestSettings.monthlyLoanInterestRate)
    : interestSettings.monthlyLoanInterestRate
  const activeLoanTotalOwed = activeLoan
    ? loanRepaymentSummary(activeLoanPrincipal, activeLoanTerm, activeLoanRate).totalRepayment
    : 0
  const remaining = activeLoan ? Math.max(activeLoanTotalOwed - activeLoanPaid, 0) : 0
  const totalSavings = sumVerifiedSavings(savingsResult.data ?? [])
  const loanEligibility = getLoanEligibility(totalSavings, sumCommittedLoanPrincipal(loans))
  const loanCurrency = activeLoan ? normalizeCurrency(activeLoan.currency) : 'USD'
  const paidPercent = activeLoanTotalOwed > 0 ? Math.round((activeLoanPaid / activeLoanTotalOwed) * 100) : 0

  const statsRows: StatsRow[] = [
    {
      icon: CreditCard,
      iconClass: 'bg-brand-100 text-brand-700',
      label: 'កម្ជីសកម្ម',
      value: activeLoan ? formatMoney(activeLoanPrincipal, loanCurrency) : formatMoney(0, 'USD'),
      meta: activeLoan ? `${paidPercent}% បានសង` : null,
      metaClass: 'text-green-600 font-medium',
    },
    {
      icon: AlertTriangle,
      iconClass: 'bg-orange-100 text-orange-700',
      label: 'នៅសល់សរុប',
      value: formatMoney(remaining, loanCurrency),
      href: activeLoan ? '/dashboard/loans/repay' : null,
      linkLabel: activeLoan ? 'សងកម្ជី' : null,
    },
    {
      icon: FileText,
      iconClass: 'bg-green-100 text-green-700',
      label: 'កម្ជីបានទទួល',
      value: String(loans.filter((l) => l.status === 'completed').length),
    },
  ]

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <PageHeader title="កម្ជីរបស់ខ្ញុំ" subtitle="គ្រប់គ្រងពាក្យសុំកម្ជី និង ការសងវិញរបស់អ្នក">
        {activeLoan && (
          <Button href="/dashboard/loans/repay" variant="outline" size="sm">
            សងកម្ជី <ArrowRight className="w-4 h-4" />
          </Button>
        )}
        {loanEligibility.canRequestLoan ? (
          <Button href="/dashboard/loans/request" size="sm">
            <Plus className="w-4 h-4" />
            ស្នើសុំកម្ជី
          </Button>
        ) : (
          <Button
            href={totalSavings <= 0 ? '/dashboard/savings/add' : '/dashboard/savings'}
            variant="outline"
            size="sm"
          >
            <Plus className="w-4 h-4" />
            {totalSavings <= 0 ? 'ដាក់ស្នើការសន្សំ' : 'មើលសមតុល្យសន្សំ'}
          </Button>
        )}
      </PageHeader>

      {!loanEligibility.canRequestLoan && (
        <AlertBanner variant="warning" className="mb-8">
          <p className="text-amber-800">
            {totalSavings <= 0
              ? 'អ្នកត្រូវមានការសន្សំដែលបានផ្ទៀងផ្ទាត់មុនពេលអាចស្នើសុំកម្ជីបាន។'
              : 'អ្នកបានឈានដល់ដែនកំណត់កម្ជីអតិបរមា (៥ ដងនៃសមតុល្យសន្សំ) រួចហើយ។'}
          </p>
        </AlertBanner>
      )}

      <StatsTable rows={statsRows} className="mb-8" />

      {/* Loans History */}
      <Card padding="none">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">ប្រវត្តិកម្ជី</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">គោលបំណង</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">ចំនួនទឹកប្រាក់</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">រយៈពេល</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">បានបើក</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">ស្ថានភាព</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">សកម្មភាព</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loans.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-500">
                    មិនទាន់មានកម្ជីដែលបានដាក់ស្នើនៅឡើយ។
                  </td>
                </tr>
              )}
              {loans.map((loan) => (
                <tr key={loan.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm text-gray-900 font-medium">{loan.purpose}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-900">{formatMoney(toNumber(loan.amount), normalizeCurrency(loan.currency))}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{loan.term_months} ខែ</td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {loan.disbursed_at ? formatKhmerDate(loan.disbursed_at) : 'រង់ចាំ'}
                  </td>
                  <td className="px-6 py-4">
                    <LoanStatusBadge status={loan.status} plain />
                  </td>
                  <td className="px-6 py-4">
                    {loan.status === 'active' && (
                      <Link
                        href="/dashboard/loans/repay"
                        className="text-brand-700 hover:text-brand-900 text-sm font-medium transition-colors"
                      >
                        សងវិញ
                      </Link>
                    )}
                    {loan.status === 'completed' && (
                      <span className="text-gray-400 text-sm">បានទទួល</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
```

- [ ] **Step 2: Verify build**

Run: `npx next build`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/app/dashboard/loans/page.tsx
git commit -m "refactor: rewrite loans page with PageHeader, StatsTable, AlertBanner, LinkButton"
```

---

### Task 8: Rewrite `/dashboard/savings/page.tsx`

**Files:**
- Modify: `src/app/dashboard/savings/page.tsx`

- [ ] **Step 1: Rewrite the savings page**

Replace the entire file content with:

```tsx
import { Card } from '@/components/ui/Card'
import { SavingStatusBadge } from '@/components/ui/Badge'
import { PageHeader } from '@/components/ui/PageHeader'
import { StatsTable, type StatsRow } from '@/components/ui/StatsTable'
import { Button } from '@/components/ui/Button'
import { requireMember } from '@/lib/auth/member'
import { createAdminClient } from '@/lib/supabase/admin'
import { formatMoney, predominantCurrency } from '@/lib/currency'
import { formatKhmerDate } from '@/lib/dates'
import { getInterestSettings, monthlySavingInterest } from '@/lib/interest'
import { toNumber } from '@/lib/utils'
import { PiggyBank, Plus, TrendingUp, ChevronRight } from 'lucide-react'

export default async function SavingsPage() {
  const member = await requireMember()
  const admin = createAdminClient()
  const { data } = await admin
    .from('savings')
    .select('id, amount, currency, saving_date, status, notes, refund_reason, verified_at, verified_by')
    .eq('member_id', member.id)
    .order('saving_date', { ascending: false })

  const savings = data ?? []
  const effectiveStatus = (saving: {
    status: string
    verified_at?: string | null
    verified_by?: string | null
  }) => {
    if (saving.status === 'refunded') return 'refunded' as const
    if (saving.verified_at || saving.verified_by) return 'completed' as const
    return saving.status as 'pending' | 'verified' | 'completed'
  }

  const verifiedSavings = savings.filter((saving) => {
    const status = effectiveStatus(saving)
    return status === 'verified' || status === 'completed'
  })
  const interestSettings = await getInterestSettings()
  const totalSavings = verifiedSavings.reduce((sum, saving) => sum + toNumber(saving.amount), 0)
  const monthlyInterest = monthlySavingInterest(totalSavings, interestSettings.monthlySavingInterestRate)
  const displayCurrency = predominantCurrency(verifiedSavings)

  const statsRows: StatsRow[] = [
    {
      icon: PiggyBank,
      iconClass: 'bg-green-100 text-green-700',
      label: 'សមតុល្យសន្សំសរុប',
      value: formatMoney(totalSavings, displayCurrency),
    },
    {
      icon: TrendingUp,
      iconClass: 'bg-brand-100 text-brand-700',
      label: 'ការប្រាក់ប្រចាំខែ',
      value: formatMoney(monthlyInterest, displayCurrency),
      meta: `${interestSettings.monthlySavingInterestRate}% ក្នុងមួយខែ`,
      metaClass: 'text-brand-600 font-medium',
    },
    {
      icon: ChevronRight,
      iconClass: 'bg-purple-100 text-purple-700',
      label: 'ការបរិច្ចាគសរុប',
      value: String(savings.length),
    },
  ]

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <PageHeader title="ការសន្សំរបស់ខ្ញុំ" subtitle="តាមដានការបរិច្ចាគប្រចាំខែ និង ការប្រាក់របស់អ្នក">
        <Button href="/dashboard/savings/add" size="sm">
          <Plus className="w-4 h-4" />
          បន្ថែមការសន្សំ
        </Button>
      </PageHeader>

      <StatsTable rows={statsRows} className="mb-8" />

      {/* Savings History */}
      <Card padding="none">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">ប្រវត្តិការសន្សំ</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">កាលបរិច្ឆេទ</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">ចំនួនទឹកប្រាក់</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">កំណត់ចំណាំ</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">ស្ថានភាព</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {savings.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-sm text-gray-500">
                    មិនទាន់មានការសន្សំដែលបានដាក់ស្នើនៅឡើយ។
                  </td>
                </tr>
              )}
              {savings.map((saving) => (
                <tr key={saving.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {formatKhmerDate(saving.saving_date)}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-semibold text-green-700">+{formatMoney(saving.amount, saving.currency ?? 'USD')}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {saving.status === 'refunded' && saving.refund_reason
                      ? saving.refund_reason
                      : saving.notes || '—'}
                  </td>
                  <td className="px-6 py-4">
                    <SavingStatusBadge status={effectiveStatus(saving)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
```

- [ ] **Step 2: Verify build**

Run: `npx next build`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/app/dashboard/savings/page.tsx
git commit -m "refactor: rewrite savings page with PageHeader, StatsTable, LinkButton"
```

---

### Task 9: Refactor main dashboard to use shared components

**Files:**
- Modify: `src/app/dashboard/page.tsx`

- [ ] **Step 1: Replace inline stats table with `StatsTable`, clean up date formatting**

Add imports at the top of the file:

```ts
import { StatsTable, type StatsRow } from '@/components/ui/StatsTable'
import { AlertBanner } from '@/components/ui/AlertBanner'
import { Button } from '@/components/ui/Button'
import { toNumber } from '@/lib/utils'
import { formatKhmerDate, formatKhmerMonthYear } from '@/lib/dates'
```

Remove the local `toNumber` function (lines 21-24). Remove the local `formatDate` function (lines 26-28) and replace its usage in the activity feed with `formatKhmerDate`. Replace the inline `toLocaleDateString` on line 164 (member joined-at) with `formatKhmerMonthYear(member.joined_at)`. Keep `STATUS_LABELS` and `translateStatus` since they're used in the activity section.

- [ ] **Step 2: Replace the inline stats table JSX (lines 172-223) with:**

```tsx
<StatsTable rows={statsRows} className="mb-8" />
```

The `statsRows` array (lines 112-153) is already defined and its type matches `StatsRow[]`. Add `: StatsRow[]` type annotation to it and update the import.

- [ ] **Step 3: Replace the inline yellow notice (lines 334-346) with:**

```tsx
<AlertBanner variant="info" className="mt-8">
  <div>
    <p className="text-yellow-900 font-semibold text-sm">អំឡុងពេលដកដើមទុន</p>
    <p className="text-yellow-700 text-sm mt-1">
      ការស្នើសុំដកដើមទុនត្រូវបានទទួលយកតែក្នុងអំឡុង ថ្ងៃទី ២០-២៥ មករា ប្រចាំឆ្នាំ។
      ប្រសិនបើអ្នកមានគម្រោងដកដើមទុនសន្សំរបស់អ្នក សូមដាក់ស្នើពាក្យសុំក្នុងអំឡុងពេលនេះ។
    </p>
    <Link href="/dashboard/capital" className="inline-flex items-center gap-1 text-yellow-800 text-sm font-medium mt-2 hover:text-yellow-900 transition-colors">
      ស្វែងយល់អំពីការស្នើសុំដើមទុន <ArrowRight className="w-4 h-4" />
    </Link>
  </div>
</AlertBanner>
```

- [ ] **Step 4: Verify build**

Run: `npx next build`
Expected: Build succeeds.

- [ ] **Step 5: Commit**

```bash
git add src/app/dashboard/page.tsx
git commit -m "refactor: use StatsTable, AlertBanner, shared toNumber on main dashboard"
```

---

### Task 10: Replace inline-styled links in form pages

**Files:**
- Modify: `src/app/dashboard/loans/request/LoanRequestForm.tsx:222-235,536-549`
- Modify: `src/app/dashboard/loans/repay/LoanRepayForm.tsx:302-314`
- Modify: `src/app/dashboard/capital/CapitalRequestForm.tsx:388-393`

- [ ] **Step 1: Update `LoanRequestForm.tsx`**

Add import at top:

```ts
import { Button } from '@/components/ui/Button'
```

Replace the inline-styled links in the ineligibility section (around lines 222-235):

```tsx
{eligibility.totalSavings <= 0 ? (
  <Button href="/dashboard/savings/add" size="md">
    <PiggyBank className="w-4 h-4" />
    ស្នើសុំការសន្សំ
  </Button>
) : null}
<Button href="/dashboard/loans" variant="outline" size="md">
  ត្រឡប់ក្រោយ
</Button>
```

Replace the inline-styled links in the success section (around lines 536-549):

```tsx
<Button href="/dashboard/loans" size="md">
  មើលកម្ជីរបស់ខ្ញុំ
</Button>
<Button href="/dashboard" variant="outline" size="md">
  ផ្ទាំងគ្រប់គ្រង
</Button>
```

- [ ] **Step 2: Update `LoanRepayForm.tsx`**

Add import at top:

```ts
import { Button } from '@/components/ui/Button'
```

Replace the inline-styled links in the success section (around lines 302-314):

```tsx
<Button href="/dashboard/loans/repay">
  ត្រឡប់ក្រោយ
</Button>
<Button href="/dashboard/loans" variant="outline">
  មើលកម្ជីរបស់ខ្ញុំ
</Button>
```

- [ ] **Step 3: Update `CapitalRequestForm.tsx`**

Add import at top:

```ts
import { Button } from '@/components/ui/Button'
```

Replace the inline-styled link in the success section (around lines 388-393):

```tsx
<Button href="/dashboard" size="md">
  ត្រឡប់ក្រោយ <ArrowRight className="w-4 h-4" />
</Button>
```

- [ ] **Step 4: Verify build**

Run: `npx next build`
Expected: Build succeeds.

- [ ] **Step 5: Commit**

```bash
git add src/app/dashboard/loans/request/LoanRequestForm.tsx src/app/dashboard/loans/repay/LoanRepayForm.tsx src/app/dashboard/capital/CapitalRequestForm.tsx
git commit -m "refactor: replace inline-styled links with Button href across dashboard forms"
```

---

### Task 11: Final verification

- [ ] **Step 1: Full build**

Run: `npx next build`
Expected: Build succeeds with 0 errors.

- [ ] **Step 2: Grep for remaining inline button patterns in dashboard**

Run: `grep -r "inline-flex items-center gap-2 bg-brand-950" src/app/dashboard/`
Expected: No matches (all replaced with Button component).

- [ ] **Step 3: Grep for remaining local toNumber**

Run: `grep -rn "function toNumber" src/`
Expected: Only one match in `src/lib/utils.ts`.
