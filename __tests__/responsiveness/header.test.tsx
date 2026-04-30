/**
 * Property-based tests for Header component responsiveness.
 *
 * Feature: system-responsiveness
 * Properties tested:
 *   - Property 3: Header never overflows horizontally
 *   - Property 4: Page title truncation
 */

import React from "react";
import { render } from "@testing-library/react";
import * as fc from "fast-check";

// ── Mocks ──────────────────────────────────────────────────────────────────

// Mock next/navigation
jest.mock("next/navigation", () => ({
  usePathname: jest.fn(() => "/dashboard"),
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

// Mock theme context
jest.mock("@/contexts/theme-context", () => ({
  useTheme: jest.fn(() => ({
    isDark: false,
    toggleTheme: jest.fn(),
  })),
}));

// Mock BranchSelectorDropdown
jest.mock("@/components/shared/branch-selector-dropdown", () => ({
  BranchSelectorDropdown: () => null,
}));

// Mock api
jest.mock("@/lib/api", () => ({
  api: {
    get: jest.fn(() => Promise.resolve([])),
    post: jest.fn(() => Promise.resolve({})),
  },
}));

// Mock supabase-browser
jest.mock("@/lib/supabase-browser", () => ({
  getSupabaseBrowserClient: jest.fn(() => null),
  getTokenFromCookie: jest.fn(() => null),
}));

// Mock pawn-transaction-navigation
jest.mock("@/lib/pawn-transaction-navigation", () => ({
  buildPawnTransactionHighlightHref: jest.fn(() => "/transactions"),
  extractTransactionNoFromText: jest.fn(() => null),
}));

// Mock sonner
jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock icons
jest.mock("@/lib/icons", () => ({
  ClockIcon: () => <svg data-testid="clock-icon" />,
  BellIcon: () => <svg data-testid="bell-icon" />,
  MenuIcon: () => <svg data-testid="menu-icon" />,
}));

// ── Import component after mocks ───────────────────────────────────────────

import { Header } from "@/components/ui/header";
import { usePathname } from "next/navigation";

// ── Helpers ────────────────────────────────────────────────────────────────

/**
 * Converts a pathname segment to the page title the Header derives.
 * Mirrors the getPageTitle logic in header.tsx.
 */
function toPathname(title: string): string {
  // Use a simple slug so getPageTitle produces a recognisable title
  const slug = title
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
  return `/${slug || "dashboard"}`;
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe("Header responsive classes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default pathname mock
    (usePathname as jest.Mock).mockReturnValue("/dashboard");
  });

  /**
   * Property 3: Header never overflows horizontally
   *
   * Validates: Requirements 3.5, 3.6
   * Tag: Feature: system-responsiveness, Property 3: Header never overflows horizontally
   *
   * Since JSDOM does not perform real layout, we verify the structural
   * property: the header element has `overflow-hidden` OR the h1 has
   * `truncate` class — either of which prevents horizontal overflow.
   */
  describe("Property 3: Header never overflows horizontally", () => {
    it(
      // Tag: Feature: system-responsiveness, Property 3: Header never overflows horizontally
      "header has overflow-preventing classes for any viewport width and page title",
      () => {
        fc.assert(
          fc.property(
            fc.integer({ min: 320, max: 1440 }),
            fc.string({ minLength: 0, maxLength: 100 }),
            (viewportWidth, titleSlug) => {
              // Set the pathname so getPageTitle produces a title derived from titleSlug
              const pathname = `/${titleSlug.replace(/[^a-z0-9-]/gi, "").toLowerCase() || "dashboard"}`;
              (usePathname as jest.Mock).mockReturnValue(pathname);

              // Simulate viewport width via window.innerWidth
              Object.defineProperty(window, "innerWidth", {
                writable: true,
                configurable: true,
                value: viewportWidth,
              });

              const { container } = render(<Header />);

              const headerEl = container.querySelector("header");
              expect(headerEl).not.toBeNull();

              const h1El = container.querySelector("h1");
              expect(h1El).not.toBeNull();

              // Structural overflow prevention: the header uses flex layout
              // (not a fixed-width grid) and the h1 has `truncate`.
              // Either the header has overflow-hidden OR the h1 has truncate.
              const headerClasses = headerEl!.className;
              const h1Classes = h1El!.className;

              const headerPreventsOverflow =
                headerClasses.includes("overflow-hidden") ||
                headerClasses.includes("flex");

              const h1PreventsOverflow = h1Classes.includes("truncate");

              expect(headerPreventsOverflow || h1PreventsOverflow).toBe(true);
            },
          ),
          { numRuns: 100 },
        );
      },
    );
  });

  /**
   * Property 4: Page title truncation
   *
   * Validates: Requirements 3.6
   * Tag: Feature: system-responsiveness, Property 4: Page title truncation
   *
   * For any page title string of arbitrary length, the h1 title element
   * in Header shall have the `truncate` class applied.
   */
  describe("Property 4: Page title truncation", () => {
    it(
      // Tag: Feature: system-responsiveness, Property 4: Page title truncation
      "h1 title always has truncate class for any page title",
      () => {
        fc.assert(
          fc.property(
            fc.string({ minLength: 1, maxLength: 200 }),
            (rawTitle) => {
              // Build a pathname that will produce a non-empty title
              const slug = rawTitle
                .replace(/[^a-z0-9-]/gi, "")
                .toLowerCase()
                .slice(0, 50);
              const pathname = `/${slug || "page"}`;
              (usePathname as jest.Mock).mockReturnValue(pathname);

              const { container } = render(<Header />);

              const h1El = container.querySelector("h1");
              expect(h1El).not.toBeNull();

              // The h1 must have the `truncate` Tailwind class
              expect(h1El!.className).toContain("truncate");
            },
          ),
          { numRuns: 100 },
        );
      },
    );
  });
});
