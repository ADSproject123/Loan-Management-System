# Dashboard UI Consistency & Reusable Components

## Problem

The `/dashboard/loans` page has an inconsistent layout (dark hero card + stat cards + table) that doesn't match the main dashboard's table-based stats pattern. The `/dashboard/savings` page has the same inconsistency. Multiple UI patterns are duplicated as inline code instead of shared components.

## Decision: Table-stats layout (Option B)

Both loans and savings pages will adopt the main dashboard's table-based stats pattern. The dark hero card on the loans page is removed. A repay button is added to the loans page header.

## New Reusable Components

### 1. `PageHeader` (`src/components/ui/PageHeader.tsx`)

Props: `{ title: string; subtitle: string; children?: ReactNode }`

Renders a flex row with title/subtitle on the left and a children slot on the right for action buttons. Replaces the duplicated header pattern in loans and savings pages.

### 2. `StatsTable` (`src/components/ui/StatsTable.tsx`)

Props:
```ts
type StatsRow = {
  icon: LucideIcon
  iconClass: string       // e.g. "bg-green-100 text-green-700"
  label: string
  value: string
  meta?: string | null
  metaClass?: string
  href?: string | null
  linkLabel?: string | null
}

{ rows: StatsRow[] }
```

Renders a `Card padding="none"` with table rows matching the main dashboard's existing pattern: icon badge + label | value | meta or link. The main dashboard's inline table-stats code is refactored to use this component.

### 3. `AlertBanner` (`src/components/ui/AlertBanner.tsx`)

Props: `{ variant: 'warning' | 'info'; children: ReactNode; icon?: LucideIcon }`

Renders a rounded banner with icon + message. Defaults icon to `AlertTriangle` for warning, `Info` for info. Replaces the inline amber alert on the loans page and the yellow notice on the main dashboard.

### 4. `LinkButton` — extend existing `Button` component

Add an `href` prop to the existing `Button` component. When `href` is provided, render as a `<Link>` instead of `<button>`. This eliminates 13 inline-styled link-buttons across the codebase.

## Shared Utility Extraction

### 5. `toNumber()` → `src/lib/utils.ts`

The `toNumber(value: unknown)` helper is duplicated in 6 files. Extract to a single shared location and update all imports.

### 6. Replace raw `toLocaleDateString('km-KH', ...)` calls

5 places use inline date formatting. Replace with the existing `formatKhmerDate` / `formatKhmerDateTime` from `src/lib/dates.ts`. Add a `formatKhmerDateShort` variant if needed for the short month format.

## Page Changes

### `/dashboard/loans/page.tsx`

- Use `PageHeader` with title "កម្ជីរបស់ខ្ញុំ" and two buttons: outline "សងកម្ជី" + primary "ស្នើសុំកម្ជី"
- Use `AlertBanner variant="warning"` for eligibility warning (conditionally rendered)
- Remove the dark `bg-brand-950` hero card entirely
- Remove the 3 stat cards grid
- Add `StatsTable` with rows: active loan amount (with % paid as meta), remaining balance, completed count
- Keep the history table as-is (just fix inline button styling)

### `/dashboard/savings/page.tsx`

- Use `PageHeader` with title "ការសន្សំរបស់ខ្ញុំ" and primary "បន្ថែមការសន្សំ" button
- Remove the 3 stat cards grid
- Add `StatsTable` with rows: total savings, monthly interest (with rate as meta), total contributions
- Keep the history table as-is

### `/dashboard/page.tsx` (main dashboard)

- Refactor inline stats table to use the shared `StatsTable` component
- Replace the inline yellow notice with `AlertBanner`
- Replace inline-styled links with `LinkButton`

### Other pages (inline button cleanup only)

- `LoanRequestForm.tsx` — replace inline-styled `<Link>`s with `LinkButton`
- `LoanRepayForm.tsx` — replace inline-styled `<Link>`s with `LinkButton`
- `CapitalRequestForm.tsx` — replace inline-styled `<Link>` with `LinkButton`

## Out of Scope

- Landing page (`src/app/page.tsx`) — different design context, not dashboard
- Admin pages — separate design system
- Form step flows — already use Button component internally
