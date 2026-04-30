# Requirements Document

## Introduction

This feature adds full responsive layout support to the PMS (Pawnshop Management System) frontend, a Next.js 14 application using Tailwind CSS. The primary target is 10–12 inch tablet and mobile screens (roughly 768px–1024px), while also ensuring usability on smaller screens down to 320px. The system currently has a fixed desktop layout with a persistent sidebar, a multi-column header, large stat cards, and wide data tables — none of which adapt gracefully to smaller viewports. This feature ensures every page and shared component renders correctly, remains navigable, and preserves full functionality across all supported screen sizes.

## Glossary

- **App_Layout**: The `AppLayout` component (`components/ui/app-layout.tsx`) that composes the Sidebar, Header, and main content area for all authenticated pages.
- **Sidebar**: The `Sidebar` component (`components/ui/sidebar.tsx`) providing primary navigation for all user roles.
- **Header**: The `Header` component (`components/ui/header.tsx`) containing the page title, clock, branch selector, notifications, theme toggle, and user avatar.
- **Data_Table**: The `DataTable` component (`components/shared/data-table.tsx`) used throughout the application to display tabular records.
- **Stat_Card**: The `StatCard` component (`components/shared/stat-card.tsx`) used on dashboards to display KPI metrics.
- **Modal**: Any full-screen overlay dialog component, including `TransactionDetailsModal`, `CustomerProfileModal`, and `PawnedItemDetailsModal`.
- **Finance_Ledger_Table**: The `FinanceLedgerTable` component (`components/shared/finance-ledger-table.tsx`) used on the branch-finance page.
- **Notification_Panel**: The notification dropdown rendered inside the Header component.
- **Breakpoint_Mobile**: Screen widths below 768px (Tailwind `sm` and below).
- **Breakpoint_Tablet**: Screen widths from 768px to 1024px (Tailwind `md` to `lg`).
- **Breakpoint_Desktop**: Screen widths above 1024px (Tailwind `lg` and above).
- **Collapsed_Sidebar**: The icon-only sidebar state used on desktop when the user toggles it to a narrow width of 72px.
- **Mobile_Sidebar**: The full-width overlay sidebar used on Breakpoint_Mobile and Breakpoint_Tablet, triggered by a hamburger menu button.
- **Page_Component**: Any route-level component under `app/(pages)/`, `app/admin/`, or `app/employee/`.

---

## Requirements

### Requirement 1: App Layout Responsiveness

**User Story:** As a user on a tablet or mobile device, I want the overall application shell to adapt to my screen size, so that I can navigate and use the system without horizontal scrolling or overlapping elements.

#### Acceptance Criteria

1. WHEN the viewport is at Breakpoint_Tablet or Breakpoint_Mobile, THE App_Layout SHALL hide the Sidebar by default and render it as a Mobile_Sidebar overlay.
2. WHEN the viewport is at Breakpoint_Desktop, THE App_Layout SHALL render the Sidebar inline as a persistent panel alongside the main content area.
3. WHILE the Mobile_Sidebar is open, THE App_Layout SHALL display a semi-transparent backdrop overlay behind the Sidebar.
4. WHEN the user taps the backdrop overlay, THE App_Layout SHALL close the Mobile_Sidebar.
5. THE App_Layout SHALL prevent the main content area from overflowing horizontally at any supported viewport width.
6. WHEN the viewport is at Breakpoint_Tablet or Breakpoint_Mobile, THE App_Layout main content area SHALL occupy the full viewport width.

---

### Requirement 2: Sidebar Responsiveness

**User Story:** As a user on a tablet or mobile device, I want the navigation sidebar to be accessible via a hamburger menu, so that it does not consume screen space when I am reading content.

#### Acceptance Criteria

1. WHEN the viewport is at Breakpoint_Tablet or Breakpoint_Mobile, THE Sidebar SHALL render as a fixed overlay panel with a width of 288px (w-72), sliding in from the left.
2. WHEN the viewport is at Breakpoint_Tablet or Breakpoint_Mobile and the Mobile_Sidebar is closed, THE Sidebar SHALL be fully hidden and not occupy any layout space.
3. WHEN the user taps a navigation link inside the Mobile_Sidebar, THE Sidebar SHALL close automatically.
4. WHEN the viewport is at Breakpoint_Desktop, THE Sidebar SHALL support toggling between its full-width (288px) and Collapsed_Sidebar (72px) states.
5. THE Sidebar SHALL trap keyboard focus within the overlay when the Mobile_Sidebar is open, and release focus when it is closed.
6. WHEN the Mobile_Sidebar is open, THE Sidebar SHALL be reachable and closeable via the Escape key.

---

### Requirement 3: Header Responsiveness

**User Story:** As a user on a tablet or mobile device, I want the top header to remain usable and uncluttered, so that I can access key actions without elements overflowing or overlapping.

#### Acceptance Criteria

1. WHEN the viewport is at Breakpoint_Tablet or Breakpoint_Mobile, THE Header SHALL display a hamburger menu button on the left side to open the Mobile_Sidebar.
2. WHEN the viewport is at Breakpoint_Desktop, THE Header SHALL hide the hamburger menu button.
3. WHEN the viewport is at Breakpoint_Mobile, THE Header SHALL hide the clock widget to preserve horizontal space.
4. WHEN the viewport is at Breakpoint_Tablet, THE Header SHALL display the clock widget in a compact form without the date portion.
5. THE Header SHALL not overflow horizontally at any supported viewport width.
6. WHEN the viewport is at Breakpoint_Mobile, THE Header page title SHALL be truncated with an ellipsis if it exceeds the available width.
7. WHEN the Notification_Panel is open on Breakpoint_Mobile, THE Notification_Panel SHALL render as a full-width panel anchored to the top of the viewport rather than a fixed-width dropdown.
8. WHEN the viewport is at Breakpoint_Tablet or Breakpoint_Mobile, THE Header branch name label SHALL be hidden to reduce clutter, with branch context accessible via the branch selector dropdown only.

---

### Requirement 4: Data Table Responsiveness

**User Story:** As a user on a tablet or mobile device, I want data tables to remain readable and scrollable, so that I can view all columns without the layout breaking.

#### Acceptance Criteria

1. THE Data_Table SHALL be wrapped in a horizontally scrollable container so that all columns remain accessible on narrow viewports.
2. WHEN the viewport is at Breakpoint_Mobile, THE Data_Table SHALL reduce cell padding to `px-3 py-2` to increase the number of visible rows.
3. THE Data_Table SHALL not cause the page to scroll horizontally; all horizontal overflow SHALL be contained within the table's own scroll container.
4. WHEN the viewport is at Breakpoint_Mobile, THE Data_Table header text SHALL remain legible at a minimum font size of 10px.
5. THE Finance_Ledger_Table SHALL apply the same horizontal scroll containment as the Data_Table.

---

### Requirement 5: Stat Card Responsiveness

**User Story:** As a user on a tablet or mobile device, I want dashboard stat cards to reflow into a readable grid, so that I can see all KPI metrics without excessive scrolling.

#### Acceptance Criteria

1. WHEN the viewport is at Breakpoint_Mobile, THE Stat_Card grid SHALL render in a 2-column layout.
2. WHEN the viewport is at Breakpoint_Tablet, THE Stat_Card grid SHALL render in a 2-column or 3-column layout depending on available width.
3. WHEN the viewport is at Breakpoint_Desktop, THE Stat_Card grid SHALL render in a 4-column layout.
4. WHEN the viewport is at Breakpoint_Mobile, THE Stat_Card value text SHALL scale down from `text-4xl` to `text-2xl` to prevent overflow within the card.
5. THE Stat_Card SHALL maintain its minimum height so that content does not overlap at any supported viewport width.

---

### Requirement 6: Modal Responsiveness

**User Story:** As a user on a tablet or mobile device, I want modals to fit within my screen, so that I can read all content and interact with all controls without scrolling off-screen.

#### Acceptance Criteria

1. WHEN a Modal is open on Breakpoint_Mobile, THE Modal SHALL occupy at least 95% of the viewport width.
2. WHEN a Modal is open on Breakpoint_Tablet, THE Modal SHALL occupy at least 90% of the viewport width up to its maximum width.
3. THE Modal SHALL be vertically scrollable when its content exceeds the viewport height.
4. WHEN a Modal is open, THE Modal close button SHALL remain visible and accessible at all supported viewport widths.
5. WHEN a Modal contains a multi-column form layout, THE Modal SHALL collapse the form to a single column on Breakpoint_Mobile.
6. WHEN a Modal contains a data table or image grid, THE Modal inner content SHALL be horizontally scrollable rather than causing the modal itself to overflow.

---

### Requirement 7: Dashboard Page Responsiveness

**User Story:** As a user on a tablet or mobile device, I want the dashboard page to display all charts, stats, and panels in a readable stacked layout, so that I can monitor system performance on any device.

#### Acceptance Criteria

1. WHEN the viewport is at Breakpoint_Mobile or Breakpoint_Tablet, THE Dashboard page chart grid SHALL collapse from a 2-column layout to a single-column layout.
2. WHEN the viewport is at Breakpoint_Mobile, THE Dashboard page filter controls SHALL stack vertically rather than rendering in a horizontal row.
3. THE Dashboard page overall summary stats section SHALL follow the Stat_Card grid responsiveness rules defined in Requirement 5.
4. WHEN the viewport is at Breakpoint_Mobile, THE Dashboard page notification panel and items-attention panel SHALL each occupy the full width in a single-column layout.

---

### Requirement 8: Page-Level Content Responsiveness

**User Story:** As a user on a tablet or mobile device, I want all pages (customers, transactions, inventory, reports, etc.) to display their filter bars, action buttons, and content areas without overflow or clipping, so that I can perform all operations on any device.

#### Acceptance Criteria

1. WHEN the viewport is at Breakpoint_Mobile, THE Page_Component filter and action bar SHALL stack its controls vertically, with each control occupying the full available width.
2. WHEN the viewport is at Breakpoint_Tablet, THE Page_Component filter and action bar SHALL arrange controls in a wrapping flex row, allowing up to two controls per row.
3. THE Page_Component SHALL not render any element that causes horizontal overflow of the page body at any supported viewport width.
4. WHEN the viewport is at Breakpoint_Mobile, THE Page_Component action buttons (e.g., "Add", "Export", "Print") SHALL remain accessible and tappable with a minimum touch target size of 44×44px.
5. WHEN the viewport is at Breakpoint_Mobile, THE Page_Component search input SHALL occupy the full available width.
6. WHERE a Page_Component contains a date range picker or multi-select dropdown, THE Page_Component SHALL render those controls in a full-width layout on Breakpoint_Mobile.

---

### Requirement 9: Finance Summary Cards Responsiveness

**User Story:** As a user on a tablet or mobile device, I want the finance summary breakdown cards to reflow into a readable grid, so that I can review all financial metrics without horizontal overflow.

#### Acceptance Criteria

1. WHEN the viewport is at Breakpoint_Mobile, THE Finance_Ledger_Table summary cards grid SHALL render in a 2-column layout.
2. WHEN the viewport is at Breakpoint_Tablet, THE Finance_Ledger_Table summary cards grid SHALL render in a 3-column or 4-column layout.
3. WHEN the viewport is at Breakpoint_Desktop, THE Finance_Ledger_Table summary cards grid SHALL render in up to 8 columns as currently implemented.
4. THE Finance_Ledger_Table summary card value text SHALL not overflow its card container at any supported viewport width.

---

### Requirement 10: Touch Interaction and Accessibility

**User Story:** As a user on a touch-enabled tablet or mobile device, I want all interactive elements to be large enough to tap accurately, so that I can use the system without accidentally triggering the wrong action.

#### Acceptance Criteria

1. THE App_Layout SHALL ensure all interactive controls (buttons, links, dropdowns) have a minimum touch target size of 44×44px on Breakpoint_Mobile and Breakpoint_Tablet.
2. WHEN the viewport is at Breakpoint_Mobile or Breakpoint_Tablet, THE Sidebar navigation items SHALL have a minimum height of 48px per item to support touch interaction.
3. THE Header action buttons (notifications, theme toggle, menu) SHALL each have a minimum touch target size of 44×44px at all viewport widths.
4. WHEN a dropdown or popover is open on a touch device, THE App_Layout SHALL close the dropdown when the user taps outside of it.
5. THE App_Layout SHALL not rely solely on hover states to reveal interactive controls; all controls SHALL be visible and accessible without hover on touch devices.
