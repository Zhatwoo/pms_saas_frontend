/**
 * Property-based tests for page-level filter bar components.
 *
 * Feature: system-responsiveness
 * Properties tested:
 *   - Property 11: Page filter bar inputs are full-width on mobile
 *   - Property 12: Action buttons meet minimum touch target size
 */

import React from "react";
import { render } from "@testing-library/react";
import * as fc from "fast-check";

// ── Mocks ──────────────────────────────────────────────────────────────────

// Mock next/navigation (required by any component that uses useRouter/usePathname)
jest.mock("next/navigation", () => ({
  usePathname: jest.fn(() => "/pawn-transactions"),
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  })),
}));

// Mock auth context
jest.mock("@/contexts/auth-context", () => ({
  useAuth: jest.fn(() => ({
    user: null,
    isLoading: false,
    login: jest.fn(),
    logout: jest.fn(),
    refreshProfile: jest.fn(),
    isSessionExpiryActive: false,
    requireReLogin: jest.fn(),
  })),
}));

// Mock branch context
jest.mock("@/contexts/branch-context", () => ({
  useBranch: jest.fn(() => ({
    selectedBranch: { id: "branch-1", name: "Main Branch" },
    branches: [],
    setSelectedBranch: jest.fn(),
    canSwitchBranch: false,
    isAllBranches: false,
    refreshBranches: jest.fn(),
  })),
}));

// ── Import components after mocks ──────────────────────────────────────────

import { TransactionActions } from "@/app/(pages)/pawn-transactions/_components/transaction-actions";
import { BranchFilters } from "@/app/(pages)/branches/_components/branch-filters";

// ── Helpers ────────────────────────────────────────────────────────────────

/**
 * Returns true if the element has `w-full` in its className.
 */
function hasWFull(el: Element): boolean {
  return el.className.includes("w-full");
}

/**
 * Returns true if the element has `h-11` or `min-h-[44px]` in its className.
 */
function hasTouchTarget(el: Element): boolean {
  return el.className.includes("h-11") || el.className.includes("min-h-[44px]");
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe("Filter bar responsive classes", () => {
  // ── Property 11 ──────────────────────────────────────────────────────────

  /**
   * Property 11: Page filter bar inputs are full-width on mobile
   *
   * Validates: Requirements 8.1, 8.5, 8.6
   * Tag: Feature: system-responsiveness, Property 11: Page filter bar inputs are full-width on mobile
   *
   * For any search input or date/select control in a page-level filter bar,
   * the element shall have `w-full` as its base class (with `sm:w-auto` or
   * `sm:w-48` etc. as the responsive override), ensuring full-width layout
   * on mobile.
   */
  describe("Property 11: Page filter bar inputs are full-width on mobile", () => {
    it(
      // Tag: Feature: system-responsiveness, Property 11: Page filter bar inputs are full-width on mobile
      "TransactionActions search input has w-full for any search string",
      () => {
        fc.assert(
          fc.property(
            fc.string({ minLength: 0, maxLength: 100 }),
            (searchValue) => {
              const { container } = render(
                <TransactionActions
                  search={searchValue}
                  purposeFilter="All"
                  selectedBranchLabel="Main Branch"
                  onSearchChange={jest.fn()}
                  onPurposeFilterChange={jest.fn()}
                />,
              );

              // The search input has no explicit type attribute (defaults to text).
              // Select the first input that is not type="date".
              const allInputs = Array.from(container.querySelectorAll("input"));
              const searchInput = allInputs.find(
                (el) => el.getAttribute("type") !== "date",
              );
              expect(searchInput).toBeDefined();
              expect(hasWFull(searchInput!)).toBe(true);
            },
          ),
          { numRuns: 100 },
        );
      },
    );

    it(
      // Tag: Feature: system-responsiveness, Property 11: Page filter bar inputs are full-width on mobile
      "TransactionActions transaction type select has w-full for any purpose filter",
      () => {
        fc.assert(
          fc.property(
            fc.constantFrom(
              "All",
              "Pawn",
              "Redeem",
              "Renew",
              "Buy Back",
              "Sold Item",
            ) as fc.Arbitrary<"All" | "Pawn" | "Redeem" | "Renew" | "Buy Back" | "Sold Item">,
            (purposeFilter) => {
              const { container } = render(
                <TransactionActions
                  search=""
                  purposeFilter={purposeFilter}
                  selectedBranchLabel="Main Branch"
                  onSearchChange={jest.fn()}
                  onPurposeFilterChange={jest.fn()}
                />,
              );

              // The transaction type select
              const selects = Array.from(container.querySelectorAll("select"));
              expect(selects.length).toBeGreaterThan(0);

              // Every select in the filter bar must have w-full
              selects.forEach((select) => {
                expect(hasWFull(select)).toBe(true);
              });
            },
          ),
          { numRuns: 100 },
        );
      },
    );

    it(
      // Tag: Feature: system-responsiveness, Property 11: Page filter bar inputs are full-width on mobile
      "TransactionActions date input has w-full when visible (list view mode)",
      () => {
        fc.assert(
          fc.property(
            fc.string({ minLength: 0, maxLength: 10 }),
            (dateValue) => {
              const { container } = render(
                <TransactionActions
                  search=""
                  purposeFilter="All"
                  selectedBranchLabel="Main Branch"
                  onSearchChange={jest.fn()}
                  onPurposeFilterChange={jest.fn()}
                  viewMode="list"
                  dateFilter={dateValue}
                  onDateFilterChange={jest.fn()}
                />,
              );

              // The date input
              const dateInput = container.querySelector('input[type="date"]');
              expect(dateInput).not.toBeNull();
              expect(hasWFull(dateInput!)).toBe(true);
            },
          ),
          { numRuns: 100 },
        );
      },
    );

    it(
      // Tag: Feature: system-responsiveness, Property 11: Page filter bar inputs are full-width on mobile
      "BranchFilters search input has w-full for any search query",
      () => {
        fc.assert(
          fc.property(
            fc.string({ minLength: 0, maxLength: 100 }),
            (searchQuery) => {
              const { container } = render(
                <BranchFilters
                  searchQuery={searchQuery}
                  onSearchChange={jest.fn()}
                  statusFilter="all"
                  onStatusChange={jest.fn()}
                />,
              );

              // The search input is a text input
              const searchInput = container.querySelector('input[type="text"]');
              expect(searchInput).not.toBeNull();
              expect(hasWFull(searchInput!)).toBe(true);
            },
          ),
          { numRuns: 100 },
        );
      },
    );

    it(
      // Tag: Feature: system-responsiveness, Property 11: Page filter bar inputs are full-width on mobile
      "BranchFilters status select wrapper has w-full for any status filter",
      () => {
        fc.assert(
          fc.property(
            fc.constantFrom("all", "Active", "Inactive", "Process", "Terminated"),
            (statusFilter) => {
              const { container } = render(
                <BranchFilters
                  searchQuery=""
                  onSearchChange={jest.fn()}
                  statusFilter={statusFilter}
                  onStatusChange={jest.fn()}
                />,
              );

              // The status select wrapper div should have w-full
              // BranchFilters wraps FilterSelect in a div with w-full sm:w-auto
              const wrapperDivs = Array.from(container.querySelectorAll("div"));
              const fullWidthWrapper = wrapperDivs.find((div) =>
                div.className.includes("w-full"),
              );
              expect(fullWidthWrapper).toBeDefined();
            },
          ),
          { numRuns: 100 },
        );
      },
    );
  });

  // ── Property 12 ──────────────────────────────────────────────────────────

  /**
   * Property 12: Action buttons meet minimum touch target size
   *
   * Validates: Requirements 8.4, 10.1, 10.3
   * Tag: Feature: system-responsiveness, Property 12: Action buttons meet minimum touch target size
   *
   * For any action button (Add, Export, Print, etc.) in a page-level component
   * or header, the button element shall have a minimum height of 44px
   * (`h-11` or `min-h-[44px]`), ensuring adequate touch target size on mobile
   * and tablet.
   */
  describe("Property 12: Action buttons meet minimum touch target size", () => {
    it(
      // Tag: Feature: system-responsiveness, Property 12: Action buttons meet minimum touch target size
      "TransactionActions Export CSV and Print Report buttons have h-11 or min-h-[44px]",
      () => {
        fc.assert(
          fc.property(
            // Generate arbitrary search strings to vary the render
            fc.string({ minLength: 0, maxLength: 50 }),
            (searchValue) => {
              const { container } = render(
                <TransactionActions
                  search={searchValue}
                  purposeFilter="All"
                  selectedBranchLabel="Main Branch"
                  onSearchChange={jest.fn()}
                  onPurposeFilterChange={jest.fn()}
                  onExportCSV={jest.fn()}
                  onPrintReport={jest.fn()}
                />,
              );

              // All buttons in the actions area
              const buttons = Array.from(container.querySelectorAll("button"));
              expect(buttons.length).toBeGreaterThan(0);

              // Every button must have a touch-target class
              buttons.forEach((button) => {
                expect(hasTouchTarget(button)).toBe(true);
              });
            },
          ),
          { numRuns: 100 },
        );
      },
    );

    it(
      // Tag: Feature: system-responsiveness, Property 12: Action buttons meet minimum touch target size
      "TransactionActions Add Transaction button has h-11 or min-h-[44px] when provided",
      () => {
        fc.assert(
          fc.property(
            fc.string({ minLength: 0, maxLength: 50 }),
            (searchValue) => {
              const { container } = render(
                <TransactionActions
                  search={searchValue}
                  purposeFilter="All"
                  selectedBranchLabel="Main Branch"
                  onSearchChange={jest.fn()}
                  onPurposeFilterChange={jest.fn()}
                  onAddTransaction={jest.fn()}
                />,
              );

              const buttons = Array.from(container.querySelectorAll("button"));
              expect(buttons.length).toBeGreaterThan(0);

              buttons.forEach((button) => {
                expect(hasTouchTarget(button)).toBe(true);
              });
            },
          ),
          { numRuns: 100 },
        );
      },
    );

    it(
      // Tag: Feature: system-responsiveness, Property 12: Action buttons meet minimum touch target size
      "BranchFilters Create Branch button has h-11 or min-h-[44px]",
      () => {
        fc.assert(
          fc.property(
            fc.string({ minLength: 0, maxLength: 50 }),
            (searchQuery) => {
              const { container } = render(
                <BranchFilters
                  searchQuery={searchQuery}
                  onSearchChange={jest.fn()}
                  statusFilter="all"
                  onStatusChange={jest.fn()}
                  onCreateBranch={jest.fn()}
                />,
              );

              // The Create Branch button
              const buttons = Array.from(container.querySelectorAll("button"));
              expect(buttons.length).toBeGreaterThan(0);

              // At least one button (Create Branch) must have the touch target class
              const hasAtLeastOneTouchTarget = buttons.some((button) =>
                hasTouchTarget(button),
              );
              expect(hasAtLeastOneTouchTarget).toBe(true);
            },
          ),
          { numRuns: 100 },
        );
      },
    );
  });
});
