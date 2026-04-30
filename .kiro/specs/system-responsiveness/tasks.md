# Implementation Plan: System Responsiveness

## Overview

Targeted, surgical Tailwind CSS changes to make the PMS frontend fully responsive on 10–12 inch tablet and mobile screens (320px–1024px) while preserving the existing desktop experience. The work is ordered from the outermost layout shell inward: AppLayout → Header → Sidebar → shared components → page-level filter bars. No new dependencies are required.

## Tasks

- [x] 1. Wire `onMenuToggle` in AppLayout and fix main content padding
  - In `components/ui/app-layout.tsx`, pass `onMenuToggle={() => setMobileMenuOpen(true)}` to the `<Header>` component (the prop already exists on `HeaderProps` but is not yet wired from `AppLayout`)
  - Change `<main>` padding from `p-8` to `p-4 md:p-6 lg:p-8`
  - _Requirements: 1.1, 1.5, 1.6_

- [x] 2. Make Header fully responsive
  - [x] 2.1 Replace 3-column grid layout with responsive flex layout
    - In `components/ui/header.tsx`, replace `grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]` with `flex items-center gap-2`
    - Update header padding to `px-4 py-3 md:px-6 md:py-4`
    - Left section: `flex min-w-0 flex-1 items-center gap-2 md:gap-4`
    - Right section: `flex shrink-0 items-center gap-1 md:gap-2 lg:gap-3`
    - _Requirements: 3.5_

  - [x] 2.2 Add hamburger button visibility and touch target
    - Ensure the hamburger `<button>` has `h-11 w-11` (44px) and `lg:hidden`
    - _Requirements: 3.1, 3.2, 10.3_

  - [x] 2.3 Add responsive page title truncation
    - Add `truncate` class to the `<h1>` title element
    - Change text size to `text-xl md:text-2xl lg:text-3xl`
    - _Requirements: 3.6_

  - [x] 2.4 Hide branch label on mobile/tablet
    - Wrap the branch name `<div>` with `hidden lg:flex`
    - _Requirements: 3.8_

  - [x] 2.5 Add `timeOnly` state and responsive clock visibility
    - Add `formatTimeOnly()` helper function (time only, no date)
    - Add `const [timeOnly, setTimeOnly] = useState("")` state
    - Update the clock `setInterval` to also call `setTimeOnly(formatTimeOnly())`
    - Clock container: `hidden md:flex` (hidden on mobile)
    - Inside clock: `<span className="hidden lg:inline">{time}</span>` for full date+time on desktop
    - Inside clock: `<span className="lg:hidden">{timeOnly}</span>` for time-only on tablet
    - _Requirements: 3.3, 3.4_

  - [x] 2.6 Fix notification button and theme toggle touch targets
    - Notification `<button>`: change to `flex h-11 w-11 items-center justify-center rounded-full`
    - `ThemeToggleButton`: change to `flex h-11 w-11 items-center justify-center rounded-full`
    - _Requirements: 10.3_

  - [x] 2.7 Make notification panel full-width on mobile
    - Change the notification panel `<div>` positioning from `absolute right-0 top-12 w-[420px]` to `fixed left-2 right-2 top-full z-50 sm:absolute sm:left-auto sm:right-0 sm:top-12 sm:w-[420px]`
    - _Requirements: 3.7_

  - [x] 2.8 Write property tests for Header responsive classes
    - **Property 3: Header never overflows horizontally**
    - **Validates: Requirements 3.5, 3.6**
    - **Property 4: Page title truncation**
    - **Validates: Requirements 3.6**

- [x] 3. Add minimum touch height to Sidebar nav items
  - In `components/ui/sidebar.tsx`, add `min-h-[48px]` to:
    - The `<button>` in `NavItemComponent` for items with sub-items
    - The inner `<div>` wrapper for regular nav link items
  - _Requirements: 2.5, 10.2_

  - [x] 3.1 Write property test for Sidebar nav item touch height
    - **Property 13: Sidebar nav items meet minimum touch height**
    - **Validates: Requirements 10.2**

- [x] 4. Make StatCard value text responsive
  - In `components/shared/stat-card.tsx`, change the value `<p>` text size from `text-4xl` to `text-2xl sm:text-4xl`
  - _Requirements: 5.4_

  - [x] 4.1 Write property test for StatCard value text
    - **Property 6: StatCard value text is responsive**
    - **Validates: Requirements 5.4**

- [x] 5. Make DataTable cell padding responsive
  - In `components/shared/data-table.tsx`, change both `<th>` and `<td>` padding from `px-4 py-3` to `px-3 py-2 sm:px-4 sm:py-3`
  - _Requirements: 4.2_

  - [x] 5.1 Write property test for DataTable overflow containment
    - **Property 5: DataTable horizontal overflow is contained**
    - **Validates: Requirements 4.1, 4.3, 4.5**

- [x] 6. Make modals responsive (width and vertical scroll)
  - [x] 6.1 Update `TransactionDetailsModal` width
    - In `components/shared/transaction-details-modal.tsx`, change `w-full max-w-5xl` to `w-[95vw] max-w-5xl md:w-[90vw]`
    - _Requirements: 6.1, 6.2_

  - [x] 6.2 Update `ViewCustomerModal` width
    - In `components/shared/customer-profile-modal.tsx`, change the `modalClass` constant from `w-full max-w-6xl` to `w-[95vw] max-w-6xl md:w-[90vw]`
    - _Requirements: 6.1, 6.2_

  - [x] 6.3 Update `PawnedItemDetailsModal` width
    - In `components/shared/pawned-item-details-modal.tsx`, change the modal container from `w-full max-w-5xl` to `w-[95vw] max-w-5xl md:w-[90vw]`
    - _Requirements: 6.1, 6.2_

  - [x] 6.4 Write property tests for modal responsive width
    - **Property 8: Modal width is viewport-relative**
    - **Validates: Requirements 6.1, 6.2**
    - **Property 9: Modal content is vertically scrollable**
    - **Validates: Requirements 6.3**

- [x] 7. Add `truncate` to FinanceSummaryCards value text
  - In `components/shared/finance-ledger-table.tsx`, add `truncate` class to the value `<p>` inside the `BREAKDOWN_ITEMS.map()` render in `FinanceSummaryCards`
  - Also add `truncate` to the "Today In" and "Today Out" value `<p>` elements
  - _Requirements: 9.4_

- [x] 8. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Make page filter bars responsive — Transactions and Branch Finance
  - [x] 9.1 Update `TransactionActions` filter bar
    - In `app/(pages)/pawn-transactions/_components/transaction-actions.tsx`:
    - Change the outer container from `flex flex-wrap items-end gap-3` to `flex flex-wrap items-end gap-2 sm:gap-3`
    - Change the search input wrapper from `w-48` to `w-full sm:w-48`
    - Change the transaction type select wrapper from `w-44` to `w-full sm:w-44`
    - Change the date input wrapper from `w-40` to `w-full sm:w-40`
    - Change the actions `<div>` from `ml-auto flex items-center gap-2` to `ml-auto flex flex-wrap items-center gap-2`
    - Ensure all `ActionButton` elements have `h-11` minimum height (check `ActionButton` component)
    - _Requirements: 8.1, 8.2, 8.4, 8.5_

  - [x] 9.2 Update `TransactionFilters` (branch-finance) filter bar
    - In `app/(pages)/branch-finance/_components/transaction-filters.tsx`:
    - Change the search input wrapper from `flex min-w-[180px] flex-1 flex-col gap-1` to `w-full flex-1 flex-col gap-1 sm:min-w-[180px]`
    - Change the branch select wrapper to `w-full sm:w-auto flex flex-col gap-1`
    - Change the date input wrapper to `w-full sm:w-auto flex flex-col gap-1`
    - Add `w-full sm:w-auto` to the branch `<select>` and date `<input>` elements
    - _Requirements: 8.1, 8.2, 8.5, 8.6_

- [x] 10. Make page filter bars responsive — Inventory and Branch Finance ledger
  - [x] 10.1 Update `InventoryFilters` filter bar
    - In `app/(pages)/inventory/_components/inventory-filters.tsx`:
    - Change the container from `flex items-end gap-4` to `flex flex-wrap items-end gap-2 sm:gap-4`
    - Ensure each `FilterSelect` wrapper is `w-full sm:w-auto`
    - _Requirements: 8.1, 8.2_

  - [x] 10.2 Update branch-finance ledger filter bar (inline in `page.tsx`)
    - In `app/(pages)/branch-finance/page.tsx`, locate the ledger filter bar section (search, type filter, date range inputs)
    - Apply `flex flex-wrap items-end gap-2 sm:gap-3` to the container
    - Apply `w-full sm:w-auto` to the search input, `LedgerTypeFilter` wrapper, and date inputs
    - _Requirements: 8.1, 8.2, 8.5, 8.6_

- [x] 11. Make page filter bars responsive — Audit Logs and Expiration Monitoring
  - [x] 11.1 Update Audit Logs filter bar
    - In `app/(pages)/audit-logs/page.tsx`, locate the search input and tab/filter controls
    - Wrap the search input in `w-full sm:w-auto` and ensure it has `w-full` base class
    - Ensure the tab buttons row uses `flex flex-wrap gap-1` so tabs wrap on narrow screens
    - _Requirements: 8.1, 8.2, 8.5_

  - [x] 11.2 Update Expiration Monitoring header action bar
    - In `app/(pages)/expiration-monitoring/page.tsx`, the header row already uses `flex flex-col sm:flex-row sm:items-center justify-between gap-4` — verify this is correct and the "Instant Email Blast" button has `h-11` minimum height
    - _Requirements: 8.4_

- [x] 12. Make page filter bars responsive — Reports, Users, and Branches
  - [x] 12.1 Update Reports page header bar
    - In `app/(pages)/reports/page.tsx`, change the header row from `flex items-center justify-between` to `flex flex-wrap items-center justify-between gap-3`
    - Ensure the "Download PDF" button has `h-11` minimum height
    - _Requirements: 8.4_

  - [x] 12.2 Update `UserActions` filter bar
    - In `app/(pages)/users/_components/user-actions.tsx`:
    - The component already uses `flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between` — verify the search input has `w-full` base class (it already has `w-full md:max-w-xs`)
    - Ensure `ActionButton` elements have `h-11` minimum height
    - _Requirements: 8.1, 8.4_

  - [x] 12.3 Update `BranchFilters` filter bar
    - In `app/(pages)/branches/_components/branch-filters.tsx`:
    - Change the container from `flex flex-wrap items-end gap-4` to `flex flex-wrap items-end gap-2 sm:gap-4`
    - Change the search input from `w-64` to `w-full sm:w-64`
    - Ensure the "Create Branch" button has `h-11` minimum height
    - _Requirements: 8.1, 8.4, 8.5_

  - [x] 12.4 Write property tests for filter bar inputs and action buttons
    - **Property 11: Page filter bar inputs are full-width on mobile**
    - **Validates: Requirements 8.1, 8.5, 8.6**
    - **Property 12: Action buttons meet minimum touch target size**
    - **Validates: Requirements 8.4, 10.1, 10.3**

- [x] 13. Verify dashboard stat grids and apply any missing responsive classes
  - Confirm `DashboardStats` in `app/(pages)/dashboard/_components/dashboard-stats.tsx` uses `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4` (already correct — no change needed)
  - Confirm `OverallSummaryStats` in `app/(pages)/dashboard/_components/overall-summary-stats.tsx` uses `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4` (already correct — no change needed)
  - Confirm `FinanceSummaryCards` in `components/shared/finance-ledger-table.tsx` uses `grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8` (already correct — no change needed)
  - _Requirements: 5.1, 5.2, 5.3, 7.3, 9.1, 9.2, 9.3_

  - [x] 13.1 Write property tests for stat card grid columns
    - **Property 7: Stat card grids are 2-column at mobile baseline**
    - **Validates: Requirements 5.1, 5.2, 5.3**

- [x] 14. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- All changes are Tailwind class additions/modifications only — no structural rewrites
- The Sidebar is already fully responsive (fixed overlay on mobile, static on desktop, focus trap, Escape key) — only the `min-h-[48px]` touch target addition is needed
- The `AppLayout` backdrop overlay is already implemented — only the `onMenuToggle` wiring is missing
- `DashboardStats`, `OverallSummaryStats`, and `FinanceSummaryCards` grids are already responsive — Task 13 is a verification step only
- Admin and employee route equivalents (`app/admin/*`, `app/employee/*`) share the same `_components` as the pages routes, so filter bar changes automatically apply to all roles
- Property tests use **fast-check** (`npm install --save-dev fast-check`) and should be placed in a `__tests__/responsiveness/` directory
- Each property test tag format: `Feature: system-responsiveness, Property {N}: {property_text}`
