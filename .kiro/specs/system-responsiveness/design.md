# Design Document: System Responsiveness

## Overview

This design covers the full responsive layout implementation for the PMS (Pawnshop Management System) frontend. The application is built with Next.js 14 (App Router), TypeScript, and Tailwind CSS. The primary target is 10–12 inch tablet screens (768px–1024px) while also supporting mobile down to 320px and preserving the existing desktop experience above 1024px.

The current codebase already has partial responsiveness infrastructure in place:
- `AppLayout` has `mobileMenuOpen` state and a backdrop overlay
- `Sidebar` has `isMobileOpen` prop, translate-x animation, focus trap, and Escape key handling
- `Header` has a hamburger button with `lg:hidden` but `onMenuToggle` is not wired from `AppLayout`
- `DataTable` has `overflow-x-auto` on its inner wrapper
- `FinanceSummaryCards` has `grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8`
- Dashboard page charts and panels already use `grid-cols-1 lg:grid-cols-2`

The work is therefore a targeted set of surgical changes rather than a full rewrite. Most changes are Tailwind class additions or small prop-wiring fixes.

---

## Architecture

### Responsive Strategy

The system uses a **mobile-first** Tailwind approach. Base classes apply to mobile (< 640px), then `sm:` (≥ 640px), `md:` (≥ 768px), `lg:` (≥ 1024px), and `xl:` (≥ 1280px) override upward.

The breakpoint mapping to requirements:
- **Breakpoint_Mobile**: base (< 768px) — `sm:` and below
- **Breakpoint_Tablet**: `md:` to `lg:` (768px–1023px)
- **Breakpoint_Desktop**: `lg:` and above (≥ 1024px)

### Layout Shell Architecture

```
AppLayout (flex h-screen overflow-hidden)
├── Backdrop overlay (fixed, z-40, lg:hidden, conditional)
├── Sidebar wrapper (no-print)
│   └── Sidebar (fixed on mobile, static on desktop)
└── Content wrapper (flex flex-1 flex-col overflow-hidden)
    ├── Header (responsive grid → flex on mobile)
    └── main (flex-1 overflow-y-auto, p-4 md:p-6 lg:p-8)
```

### Change Scope

| Component | Change Type | Effort |
|---|---|---|
| `AppLayout` | Wire `onMenuToggle` to Header | Minimal |
| `Header` | Responsive layout, clock visibility, notification panel width, branch label | Moderate |
| `Sidebar` | Nav item min-height | Minimal |
| `StatCard` | Responsive value text size | Minimal |
| `DataTable` | Responsive cell padding | Minimal |
| `DashboardStats` | Grid already correct | None |
| `OverallSummaryStats` | Grid already correct | None |
| `TransactionDetailsModal` | Responsive width | Minimal |
| `ViewCustomerModal` | Responsive width, single-column form | Minimal |
| Page filter bars | Flex-wrap, full-width inputs, touch targets | Moderate (per page) |
| `AppLayout` main padding | Responsive padding | Minimal |

---

## Components and Interfaces

### 1. AppLayout (`components/ui/app-layout.tsx`)

**Current state:** Has `mobileMenuOpen` state and backdrop, but does not pass `onMenuToggle` to `Header`. Main content has fixed `p-8`.

**Changes required:**

```tsx
// Wire onMenuToggle to Header
<Header
  userInitials={userInitials}
  notificationCount={notificationCount}
  branchName={...}
  hideBranchSelector={hideBranchSelector}
  onMenuToggle={() => setMobileMenuOpen(true)}  // ADD THIS
/>

// Responsive main padding
<main className="flex-1 overflow-y-auto bg-pawn-content p-4 md:p-6 lg:p-8 transition-colors duration-300">
```

The `no-print` wrapper around Sidebar does not need changes — the Sidebar itself handles its own positioning via `fixed` on mobile and `lg:static` on desktop. The content wrapper already uses `flex-1` which correctly fills the remaining space.

**No interface changes needed.** `AppLayoutProps` is unchanged.

---

### 2. Header (`components/ui/header.tsx`)

**Current state:** Uses `grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]` which is fine on desktop but causes overflow on mobile. Clock has `min-w-[180px]`. Notification panel is `w-[420px]`. Branch label is always visible. Hamburger button exists with `lg:hidden` but `onMenuToggle` is not passed from AppLayout.

**Changes required:**

#### 2a. Header layout — switch from 3-column grid to responsive flex

The 3-column grid approach breaks on mobile because the center clock column forces a minimum width. Replace with a responsive flex layout:

```tsx
// BEFORE
<header className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center border-b ...">

// AFTER
<header className="flex items-center gap-2 border-b border-border-main bg-header-bg px-4 py-3 md:px-6 md:py-4 transition-colors duration-300">
```

Left section (title + hamburger):
```tsx
<div className="flex min-w-0 flex-1 items-center gap-2 md:gap-4">
  {/* Hamburger — visible on mobile/tablet only */}
  {onMenuToggle && (
    <button
      type="button"
      onClick={onMenuToggle}
      aria-label="Open sidebar"
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-border-main text-text-tertiary transition hover:bg-surface-hover hover:text-text-primary lg:hidden"
    >
      <MenuIcon />
    </button>
  )}
  <h1 className="truncate text-xl font-bold text-text-primary leading-none md:text-2xl lg:text-3xl">
    {title}
  </h1>
  {/* Branch label — hidden on mobile/tablet */}
  {branchName && (
    <div className="hidden lg:flex items-center gap-4">
      <span className="h-6 w-px bg-border-main" />
      <span className="text-base font-semibold text-emerald-600 dark:text-emerald-400">
        {branchName}
      </span>
    </div>
  )}
</div>
```

Center section (clock — hidden on mobile, compact on tablet):
```tsx
{/* Clock — hidden on mobile, time-only on tablet, full on desktop */}
<div className="hidden md:flex items-center gap-2 rounded-full border border-border-main px-3 py-2 text-sm text-text-tertiary lg:px-4 lg:text-base">
  <ClockIcon />
  <span className="hidden lg:inline">{time}</span>          {/* full date+time on desktop */}
  <span className="lg:hidden">{timeOnly}</span>              {/* time only on tablet */}
</div>
```

This requires splitting `formatDateTime()` into two functions:
```ts
function formatTimeOnly(): string {
  const now = new Date();
  return now.toLocaleString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}

function formatDateTime(): string {
  // existing implementation unchanged
}
```

And maintaining two state values:
```ts
const [time, setTime] = useState("");
const [timeOnly, setTimeOnly] = useState("");

// In useEffect:
setTime(formatDateTime());
setTimeOnly(formatTimeOnly());
const clockInterval = setInterval(() => {
  setTime(formatDateTime());
  setTimeOnly(formatTimeOnly());
}, 1000);
```

Right section (actions):
```tsx
<div className="flex shrink-0 items-center gap-1 md:gap-2 lg:gap-3">
  {/* Branch Selector */}
  {!hideBranchSelector && !isCustomerDetailPage && <BranchSelectorDropdown />}
  {/* Notifications */}
  <div className="relative" ref={notificationRef}>
    <button className="relative flex h-11 w-11 items-center justify-center rounded-full text-text-tertiary transition-colors hover:bg-surface-hover hover:text-text-primary" ...>
```

#### 2b. Notification panel — full-width on mobile

```tsx
{isNotificationOpen && (
  <div className="
    fixed inset-x-0 top-[57px] z-50 mx-2 rounded-xl border border-border-main bg-header-bg p-4 shadow-xl
    sm:absolute sm:inset-x-auto sm:right-0 sm:top-12 sm:mx-0 sm:w-[420px]
  ">
```

The `top-[57px]` value matches the header height (py-3 × 2 + icon height ≈ 57px on mobile). On `sm:` and above it reverts to the absolute positioned dropdown.

#### 2c. Touch target sizes

All header action buttons (notifications, theme toggle) must be `h-11 w-11` (44px):
```tsx
// Notification button
className="relative flex h-11 w-11 items-center justify-center rounded-full ..."

// ThemeToggleButton
className="relative flex h-11 w-11 items-center justify-center rounded-full ..."

// User avatar
className="h-11 w-11 overflow-hidden rounded-full ..."  // already correct
```

---

### 3. Sidebar (`components/ui/sidebar.tsx`)

**Current state:** Nav items use `px-4 py-3`. The sidebar itself is already fully responsive with fixed/static positioning, translate-x animation, focus trap, and Escape key handling.

**Changes required:**

Nav item minimum height for touch targets (48px):
```tsx
// In NavItemComponent — button for items with sub-items
className={`flex w-full min-h-[48px] items-center justify-between ... px-4 py-3 ...`}

// Regular nav item link wrapper div
className={`flex min-h-[48px] items-center gap-3 ... px-4 py-3 ...`}

// Sub-item links
className={`block min-h-[44px] flex items-center rounded-lg px-4 py-2.5 ...`}
```

The `py-3` (12px × 2 = 24px padding) plus the text line height (~24px) already reaches ~48px in practice, but adding `min-h-[48px]` makes it explicit and guarantees the minimum regardless of content.

---

### 4. StatCard (`components/shared/stat-card.tsx`)

**Current state:** Value text uses `text-4xl` unconditionally.

**Changes required:**

```tsx
// BEFORE
<p className={`mt-1 text-4xl font-bold text-text-primary ${valueClassName}`}>{value}</p>

// AFTER
<p className={`mt-1 text-2xl font-bold text-text-primary sm:text-4xl ${valueClassName}`}>{value}</p>
```

The `valueClassName` prop allows callers to override this if needed (e.g., `OverallSummaryStats` already uses `text-2xl sm:text-3xl` on its special sales card directly).

---

### 5. DataTable (`components/shared/data-table.tsx`)

**Current state:** Cell padding is `px-4 py-3` on both `th` and `td`. Already has `overflow-x-auto` on the inner wrapper.

**Changes required:**

```tsx
// th — header cells
className={`whitespace-nowrap px-3 py-2 sm:px-4 sm:py-3 text-xs font-bold uppercase tracking-wide ...`}

// td — data cells
className={`whitespace-nowrap px-3 py-2 sm:px-4 sm:py-3 text-sm text-text-secondary ...`}
```

No structural changes needed — the `overflow-hidden` outer div and `overflow-x-auto` inner div are already correct.

---

### 6. TransactionDetailsModal (`components/shared/transaction-details-modal.tsx`)

**Current state:** Modal container is `w-full max-w-5xl`. Already has `max-h-[92vh] overflow-y-auto`.

**Changes required:**

```tsx
// BEFORE
<div className="max-h-[92vh] w-full max-w-5xl scale-in-center overflow-y-auto rounded-[28px] ...">

// AFTER
<div className="max-h-[92vh] w-[95vw] max-w-5xl scale-in-center overflow-y-auto rounded-[28px] md:w-[90vw] ...">
```

The info grid inside already uses `md:grid-cols-2 xl:grid-cols-3` which collapses to single column on mobile — no change needed there.

---

### 7. ViewCustomerModal (`components/shared/customer-profile-modal.tsx`)

**Current state:** Modal container is `max-w-6xl`. Body grid is `xl:grid-cols-[1.02fr_0.98fr]` (single column below xl). Inner form grids use `md:grid-cols-2`.

**Changes required:**

```tsx
// Modal container — add responsive width
const modalClass =
  "w-[95vw] max-w-6xl overflow-hidden rounded-[2rem] border border-border-main bg-surface shadow-2xl anim-modal-enter md:w-[90vw]";
```

The body grid `xl:grid-cols-[1.02fr_0.98fr]` already collapses to single column below xl — this is correct behavior. The inner form grids `md:grid-cols-2` already collapse to single column on mobile — also correct.

The overlay already uses `overflow-y-auto` via `overlayClass` — no change needed.

---

### 8. Dashboard Stats Grids

**DashboardStats** (`dashboard-stats.tsx`): Already uses `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4` — no change needed.

**OverallSummaryStats** (`overall-summary-stats.tsx`): Already uses `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4` — no change needed.

---

### 9. Page-Level Filter Bars

The pattern used across pages (customers, pawn-transactions, inventory, etc.) needs a consistent responsive treatment. The `TransactionActions` component is the most complex example.

**Standard responsive filter bar pattern:**

```tsx
// Filter/action bar container
<div className="flex flex-wrap items-center gap-2 sm:gap-3">
  {/* Search input — full width on mobile */}
  <input
    className="w-full rounded-lg border ... sm:w-auto sm:min-w-[200px]"
    ...
  />
  {/* Date filter — full width on mobile */}
  <input
    type="date"
    className="w-full rounded-lg border ... sm:w-auto"
    ...
  />
  {/* Select/dropdown — full width on mobile */}
  <select className="w-full rounded-lg border ... sm:w-auto" ...>
  {/* Action buttons — min touch target */}
  <button className="flex h-11 min-w-[44px] items-center gap-2 rounded-lg px-4 ...">
    Export
  </button>
</div>
```

Key rules:
1. Container: `flex flex-wrap items-center gap-2 sm:gap-3`
2. Text inputs and selects: `w-full sm:w-auto`
3. Date inputs: `w-full sm:w-auto`
4. Action buttons: `h-11` (44px) minimum height, `min-w-[44px]`
5. The outer page wrapper already uses `space-y-5` which provides vertical rhythm

Pages that need filter bar updates:
- `pawn-transactions` — `TransactionActions` component
- `branch-finance` — date range + type filter bar
- `inventory` — search + filter bar
- `audit-logs` — search + date filter bar
- `expiration-monitoring` — filter bar
- `reports` — date range + export bar
- `users` — search + role filter bar
- `branches` — search bar

---

### 10. FinanceSummaryCards (`components/shared/finance-ledger-table.tsx`)

**Current state:** Already has `grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8` — this is correct per requirements.

**Changes required:** None to the grid. The value text uses `text-lg font-black` which is appropriate for the card size. Add `truncate` to value text to prevent overflow:

```tsx
<p className={`mt-2 text-lg font-black truncate ${colorClass}`}>
  {item.direction === "out" ? "-" : "+"}{fmt(val)}
</p>
```

---

## Data Models

No new data models are introduced. This feature is purely a UI/CSS change. The existing component props and state remain unchanged except:

- `AppLayout` passes `onMenuToggle` to `Header` (existing prop, now wired)
- `Header` gains internal `timeOnly` state (string, derived from clock interval)

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Main content never overflows horizontally

*For any* viewport width in the supported range [320px, 1440px], the main content area of `AppLayout` shall not produce horizontal scroll — its `scrollWidth` shall equal its `clientWidth`.

**Validates: Requirements 1.5, 8.3**

---

### Property 2: Mobile content area is full-width

*For any* viewport width below 1024px (Breakpoint_Mobile or Breakpoint_Tablet), the main content wrapper in `AppLayout` shall occupy the full viewport width with no left-margin offset from the sidebar.

**Validates: Requirements 1.6, 2.2**

---

### Property 3: Header never overflows horizontally

*For any* viewport width in the supported range [320px, 1440px] and any page title string, the `Header` component's rendered width shall not exceed the viewport width.

**Validates: Requirements 3.5, 3.6**

---

### Property 4: Page title truncation

*For any* page title string of arbitrary length, the `h1` title element in `Header` shall have the `truncate` class applied, ensuring text overflow is handled with an ellipsis rather than causing layout overflow.

**Validates: Requirements 3.6**

---

### Property 5: DataTable horizontal overflow is contained

*For any* `DataTable` instance with any number of columns, the outer container shall have `overflow-hidden` and the inner wrapper shall have `overflow-x-auto`, ensuring horizontal overflow is contained within the table's own scroll region and does not propagate to the page body.

**Validates: Requirements 4.1, 4.3, 4.5**

---

### Property 6: StatCard value text is responsive

*For any* `StatCard` instance, the value text element shall have `text-2xl` as its base class and `sm:text-4xl` as its responsive override, ensuring the value scales down on mobile to prevent overflow within the card.

**Validates: Requirements 5.4**

---

### Property 7: Stat card grids are 2-column at mobile baseline

*For any* stat card grid container (DashboardStats, OverallSummaryStats), the grid shall have `grid-cols-2` as its base class, ensuring a 2-column layout at mobile viewport widths.

**Validates: Requirements 5.1, 5.2, 5.3**

---

### Property 8: Modal width is viewport-relative

*For any* modal component (TransactionDetailsModal, ViewCustomerModal), the modal container shall have `w-[95vw]` as its base width class, ensuring the modal occupies at least 95% of the viewport width on mobile.

**Validates: Requirements 6.1, 6.2**

---

### Property 9: Modal content is vertically scrollable

*For any* modal component, the scrollable content container shall have `overflow-y-auto` and a `max-h-[Xvh]` constraint, ensuring the modal does not exceed the viewport height and its content remains scrollable.

**Validates: Requirements 6.3**

---

### Property 10: Modal form grids collapse to single column on mobile

*For any* multi-column form grid inside a modal, the grid shall have `grid-cols-1` as its base class and `md:grid-cols-2` as its responsive override, ensuring single-column layout on mobile.

**Validates: Requirements 6.5**

---

### Property 11: Page filter bar inputs are full-width on mobile

*For any* search input or date/select control in a page-level filter bar, the element shall have `w-full` as its base class (with `sm:w-auto` as the responsive override), ensuring full-width layout on mobile.

**Validates: Requirements 8.1, 8.5, 8.6**

---

### Property 12: Action buttons meet minimum touch target size

*For any* action button (Add, Export, Print, etc.) in a page-level component or header, the button element shall have a minimum height of 44px (`h-11` or `min-h-[44px]`), ensuring adequate touch target size on mobile and tablet.

**Validates: Requirements 8.4, 10.1, 10.3**

---

### Property 13: Sidebar nav items meet minimum touch height

*For any* navigation item in the `Sidebar` component, the interactive element (button or link wrapper) shall have `min-h-[48px]`, ensuring adequate touch target height on mobile and tablet.

**Validates: Requirements 10.2**

---

## Error Handling

This feature introduces no new error states. The changes are purely presentational (CSS classes and layout). Existing error handling in data-fetching components is unaffected.

One edge case to handle: the notification panel's `top-[57px]` offset on mobile assumes a fixed header height. If the header height changes (e.g., due to very long branch names wrapping), the panel may misalign. Mitigation: use `top-full` on the notification panel's mobile positioning instead of a hardcoded pixel value, anchoring it to the bottom of the header element.

```tsx
// Preferred approach for notification panel mobile positioning
<div className="
  fixed left-2 right-2 top-full z-50 rounded-xl ...
  sm:absolute sm:left-auto sm:right-0 sm:top-12 sm:w-[420px]
">
```

This requires the notification panel's parent `<div className="relative">` to be inside the header flow, which it already is.

---

## Testing Strategy

### Unit Tests (Example-Based)

These tests verify specific behaviors with concrete examples:

1. **AppLayout wiring** — Render AppLayout, assert Header receives `onMenuToggle` prop; click hamburger, assert `mobileMenuOpen` becomes true.
2. **Backdrop render** — With `mobileMenuOpen=true`, assert backdrop element is in the DOM with `bg-black/50` class.
3. **Backdrop click closes sidebar** — Click backdrop, assert `mobileMenuOpen` becomes false.
4. **Sidebar hidden by default on mobile** — Render Sidebar with `isMobileOpen=false`, assert `-translate-x-full` and `pointer-events-none` classes.
5. **Sidebar visible when open** — Render Sidebar with `isMobileOpen=true`, assert `translate-x-0` class.
6. **Escape key closes sidebar** — Dispatch Escape keydown on open sidebar, assert `onMobileClose` called.
7. **Nav link closes sidebar** — Click nav link, assert `onNavigate` called.
8. **Clock hidden on mobile** — Assert clock container has `hidden md:flex` class.
9. **Clock date hidden on tablet** — Assert date portion has `hidden lg:inline` class.
10. **Branch label hidden on mobile/tablet** — Assert branch label has `hidden lg:flex` class.
11. **Notification panel full-width on mobile** — Assert panel has `fixed left-2 right-2` classes at mobile.
12. **Finance summary cards grid** — Assert `FinanceSummaryCards` grid has `grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8`.

### Property-Based Tests (Universal Properties)

These tests use a property-based testing library to verify universal properties across many generated inputs. The recommended library for this TypeScript/React project is **fast-check** (`npm install --save-dev fast-check`).

Each property test runs a minimum of **100 iterations**.

**Tag format:** `Feature: system-responsiveness, Property {N}: {property_text}`

#### Property 1 Test: Main content overflow
```ts
// Feature: system-responsiveness, Property 1: Main content never overflows horizontally
it.prop([fc.integer({ min: 320, max: 1440 })])('main content does not overflow at any viewport width', (width) => {
  // Render AppLayout at given width, measure scrollWidth vs clientWidth
  // Assert scrollWidth <= clientWidth
});
```

#### Property 3 Test: Header overflow
```ts
// Feature: system-responsiveness, Property 3: Header never overflows horizontally
it.prop([
  fc.integer({ min: 320, max: 1440 }),
  fc.string({ minLength: 0, maxLength: 100 })
])('header does not overflow for any viewport width and page title', (width, title) => {
  // Render Header with given title at given width
  // Assert header scrollWidth <= clientWidth
});
```

#### Property 4 Test: Page title truncation
```ts
// Feature: system-responsiveness, Property 4: Page title truncation
it.prop([fc.string({ minLength: 1, maxLength: 200 })])('h1 title always has truncate class', (title) => {
  // Render Header with given title
  // Assert h1 has 'truncate' class
});
```

#### Property 5 Test: DataTable overflow containment
```ts
// Feature: system-responsiveness, Property 5: DataTable horizontal overflow is contained
it.prop([
  fc.array(fc.record({ key: fc.string(), label: fc.string() }), { minLength: 1, maxLength: 20 })
])('DataTable outer has overflow-hidden, inner has overflow-x-auto', (columns) => {
  // Render DataTable with given columns
  // Assert outer div has 'overflow-hidden' class
  // Assert inner div has 'overflow-x-auto' class
});
```

#### Property 6 Test: StatCard value text
```ts
// Feature: system-responsiveness, Property 6: StatCard value text is responsive
it.prop([
  fc.oneof(fc.string(), fc.integer()),
  fc.string()
])('StatCard value text has text-2xl sm:text-4xl', (value, label) => {
  // Render StatCard with given value and label
  // Assert value p element has 'text-2xl' and 'sm:text-4xl' classes
});
```

#### Property 7 Test: Stat card grid columns
```ts
// Feature: system-responsiveness, Property 7: Stat card grids are 2-column at mobile baseline
it.prop([fc.array(fc.record({ label: fc.string(), value: fc.string() }), { minLength: 1, maxLength: 8 })])
('stat card grid has grid-cols-2 base class', (cards) => {
  // Render DashboardStats or OverallSummaryStats
  // Assert grid container has 'grid-cols-2' class
});
```

#### Property 8 Test: Modal width
```ts
// Feature: system-responsiveness, Property 8: Modal width is viewport-relative
it.prop([fc.boolean()])('modal container has w-[95vw] base class', (isOpen) => {
  if (!isOpen) return; // only test when open
  // Render TransactionDetailsModal or ViewCustomerModal with isOpen=true
  // Assert modal container has 'w-[95vw]' class
});
```

#### Property 11 Test: Filter bar inputs full-width
```ts
// Feature: system-responsiveness, Property 11: Page filter bar inputs are full-width on mobile
it.prop([fc.string()])('search input has w-full base class', (placeholder) => {
  // Render a page filter bar component
  // Assert search input has 'w-full' class
});
```

#### Property 12 Test: Action button touch targets
```ts
// Feature: system-responsiveness, Property 12: Action buttons meet minimum touch target size
it.prop([fc.string()])('action buttons have h-11 or min-h-[44px]', (label) => {
  // Render a page action button
  // Assert button has 'h-11' or 'min-h-[44px]' class
});
```

#### Property 13 Test: Sidebar nav item touch height
```ts
// Feature: system-responsiveness, Property 13: Sidebar nav items meet minimum touch height
it.prop([
  fc.array(fc.record({ label: fc.string(), href: fc.string() }), { minLength: 1, maxLength: 10 })
])('sidebar nav items have min-h-[48px]', (items) => {
  // Render Sidebar with given nav items
  // Assert each nav item button/link has 'min-h-[48px]' class
});
```

### Integration Tests

These verify that the responsive layout works end-to-end in a real browser environment:

1. **Mobile layout smoke test** — At 375px viewport, navigate to dashboard; assert no horizontal scrollbar, sidebar is hidden, hamburger is visible.
2. **Tablet layout smoke test** — At 768px viewport, navigate to dashboard; assert no horizontal scrollbar, sidebar is hidden, clock shows time-only.
3. **Desktop layout smoke test** — At 1280px viewport, navigate to dashboard; assert sidebar is visible inline, clock shows full date+time.
4. **Mobile sidebar open/close** — At 375px, tap hamburger, assert sidebar slides in; tap backdrop, assert sidebar closes.
5. **Modal on mobile** — At 375px, open TransactionDetailsModal, assert modal width is ≥ 95% of viewport, assert vertical scroll works.
