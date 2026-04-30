/**
 * Property-based tests for Sidebar component responsiveness.
 *
 * Feature: system-responsiveness
 * Properties tested:
 *   - Property 13: Sidebar nav items meet minimum touch height
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

// Mock next/link
jest.mock("next/link", () => {
  const MockLink = ({
    children,
    href,
    onClick,
  }: {
    children: React.ReactNode;
    href: string;
    onClick?: () => void;
  }) => (
    <a href={href} onClick={onClick}>
      {children}
    </a>
  );
  MockLink.displayName = "MockLink";
  return MockLink;
});

// Mock next/image
jest.mock("next/image", () => {
  const MockImage = ({
    src,
    alt,
    width,
    height,
    className,
  }: {
    src: string;
    alt: string;
    width: number;
    height: number;
    className?: string;
  }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} width={width} height={height} className={className} />
  );
  MockImage.displayName = "MockImage";
  return MockImage;
});

// Mock opening-checklist-context
jest.mock("@/contexts/opening-checklist-context", () => ({
  useOpeningChecklist: jest.fn(() => ({
    resetChecklist: jest.fn(),
    isChecklistComplete: true,
    checklistItems: [],
  })),
}));

// Mock icons
jest.mock("@/lib/icons", () => ({
  LogoutIcon: () => <svg data-testid="logout-icon" />,
  MenuIcon: () => <svg data-testid="menu-icon" />,
  CloseIcon: () => <svg data-testid="close-icon" />,
}));

// Mock constants
jest.mock("@/lib/constants", () => ({
  APP_SHORT_NAME: "PMS",
  APP_TAGLINE: "Pawnshop Management",
  getNavForRole: jest.fn(() => []),
}));

// Mock auth lib
jest.mock("@/lib/auth", () => ({
  getRoleLabel: jest.fn((role: string) => role),
}));

// ── Import component after mocks ───────────────────────────────────────────

import { Sidebar } from "@/components/ui/sidebar";
import type { NavGroup } from "@/types";

// ── Helpers ────────────────────────────────────────────────────────────────

/**
 * Creates a simple icon element for nav items.
 */
function makeIcon(label: string): React.ReactNode {
  return <svg data-testid={`icon-${label}`} />;
}

/**
 * Builds a NavGroup array from generated labels.
 */
function buildNavGroups(
  items: Array<{ label: string; href: string; hasSubItems: boolean }>,
): NavGroup[] {
  return [
    {
      section: "Main",
      items: items.map((item) => ({
        label: item.label,
        href: item.href,
        icon: makeIcon(item.label),
        subItems: item.hasSubItems
          ? [
              { label: `${item.label} Sub 1`, href: `${item.href}/sub1` },
              { label: `${item.label} Sub 2`, href: `${item.href}/sub2` },
            ]
          : undefined,
      })),
    },
  ];
}

// ── Default Sidebar props ──────────────────────────────────────────────────

const defaultSidebarProps = {
  collapsed: false,
  isMobileOpen: false,
  onToggle: jest.fn(),
  onMobileClose: jest.fn(),
  onNavigate: jest.fn(),
  userName: "Test User",
  userRole: "admin" as const,
  onLogout: jest.fn(),
  disabled: false,
};

// ── Tests ──────────────────────────────────────────────────────────────────

describe("Sidebar responsive classes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /**
   * Property 13: Sidebar nav items meet minimum touch height
   *
   * Validates: Requirements 10.2
   * Tag: Feature: system-responsiveness, Property 13: Sidebar nav items meet minimum touch height
   *
   * For any set of navigation items rendered in the Sidebar, each interactive
   * nav item element (button or link wrapper div) shall have `min-h-[48px]`
   * in its className.
   */
  describe("Property 13: Sidebar nav items meet minimum touch height", () => {
    it(
      // Tag: Feature: system-responsiveness, Property 13: Sidebar nav items meet minimum touch height
      "all nav item interactive elements have min-h-[48px] for any set of nav items",
      () => {
        fc.assert(
          fc.property(
            fc.array(
              fc.record({
                label: fc.string({ minLength: 1, maxLength: 30 }).filter(
                  (s) => s.trim().length > 0,
                ),
                href: fc.string({ minLength: 1, maxLength: 30 }).map(
                  (s) => `/${s.replace(/[^a-z0-9-]/gi, "a")}`,
                ),
                hasSubItems: fc.boolean(),
              }),
              { minLength: 1, maxLength: 8 },
            ),
            (items) => {
              const navGroups = buildNavGroups(items);

              const { container } = render(
                <Sidebar {...defaultSidebarProps} navGroups={navGroups} />,
              );

              // Items with sub-items render as <button> elements
              // Regular items render as <div> elements (inside <a> links)
              // Both must have min-h-[48px]

              const itemsWithSubItems = items.filter((i) => i.hasSubItems);
              const regularItems = items.filter((i) => !i.hasSubItems);

              // Check buttons (for items with sub-items)
              if (itemsWithSubItems.length > 0) {
                // Find nav buttons — they are inside the nav element
                const navEl = container.querySelector("nav");
                expect(navEl).not.toBeNull();

                const navButtons = Array.from(
                  navEl!.querySelectorAll("button"),
                );

                // Each button for a sub-item parent should have min-h-[48px]
                navButtons.forEach((btn) => {
                  expect(btn.className).toContain("min-h-[48px]");
                });
              }

              // Check link wrapper divs (for regular items without sub-items)
              if (regularItems.length > 0) {
                const navEl = container.querySelector("nav");
                expect(navEl).not.toBeNull();

                // Regular items render as <a><div class="... min-h-[48px] ...">
                const linkDivs = Array.from(
                  navEl!.querySelectorAll("a > div"),
                );

                linkDivs.forEach((div) => {
                  expect(div.className).toContain("min-h-[48px]");
                });
              }
            },
          ),
          { numRuns: 100 },
        );
      },
    );
  });
});
