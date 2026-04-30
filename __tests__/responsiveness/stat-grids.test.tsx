/**
 * Property-based tests for dashboard stat card grid responsiveness.
 *
 * Feature: system-responsiveness
 * Properties tested:
 *   - Property 7: Stat card grids are 2-column at mobile baseline
 */

import React from "react";
import { render } from "@testing-library/react";
import * as fc from "fast-check";

import { DashboardStats } from "@/app/(pages)/dashboard/_components/dashboard-stats";
import { OverallSummaryStats } from "@/app/(pages)/dashboard/_components/overall-summary-stats";

// ── Tests ──────────────────────────────────────────────────────────────────

describe("Stat card grid responsive classes", () => {
  /**
   * Property 7: Stat card grids are 2-column at mobile baseline
   *
   * Validates: Requirements 5.1, 5.2, 5.3
   * Tag: Feature: system-responsiveness, Property 7: Stat card grids are 2-column at mobile baseline
   *
   * For any stat card grid container (DashboardStats, OverallSummaryStats),
   * the grid shall have `grid-cols-2` as its base class (or `sm:grid-cols-2`),
   * ensuring a 2-column layout at mobile/tablet viewport widths.
   *
   * DashboardStats uses `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`.
   * OverallSummaryStats uses `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`.
   * Both satisfy the requirement via `sm:grid-cols-2`.
   */
  describe("Property 7: Stat card grids are 2-column at mobile baseline", () => {
    /**
     * DashboardStats — grid has sm:grid-cols-2 for any data input
     */
    it(
      // Tag: Feature: system-responsiveness, Property 7: Stat card grids are 2-column at mobile baseline
      "DashboardStats grid container has sm:grid-cols-2 for any data and period",
      () => {
        fc.assert(
          fc.property(
            // Generate optional data object
            fc.option(
              fc.record({
                activeContracts: fc.integer({ min: 0, max: 10_000 }),
                itemsNearExpiration: fc.integer({ min: 0, max: 10_000 }),
                itemsReadyForSale: fc.integer({ min: 0, max: 10_000 }),
                monthlyRevenue: fc.string({ minLength: 0, maxLength: 20 }),
              }),
              { nil: undefined },
            ),
            // Generate optional period string
            fc.option(fc.string({ minLength: 0, maxLength: 30 }), {
              nil: undefined,
            }),
            (data, period) => {
              const { container } = render(
                <DashboardStats data={data} period={period} />,
              );

              // The outermost element is the grid container div
              const gridEl = container.firstElementChild as HTMLElement;
              expect(gridEl).not.toBeNull();

              const classes = gridEl.className;

              // Must have sm:grid-cols-2 (2-column layout at sm breakpoint / mobile baseline)
              expect(classes).toContain("sm:grid-cols-2");
            },
          ),
          { numRuns: 100 },
        );
      },
    );

    /**
     * OverallSummaryStats — grid has sm:grid-cols-2 for any data input
     */
    it(
      // Tag: Feature: system-responsiveness, Property 7: Stat card grids are 2-column at mobile baseline
      "OverallSummaryStats grid container has sm:grid-cols-2 for any data",
      () => {
        fc.assert(
          fc.property(
            // Generate optional data object
            fc.option(
              fc.record({
                totalContracts: fc.oneof(
                  fc.integer({ min: 0, max: 10_000 }),
                  fc.string({ minLength: 0, maxLength: 10 }),
                ),
                active: fc.oneof(
                  fc.integer({ min: 0, max: 10_000 }),
                  fc.string({ minLength: 0, maxLength: 10 }),
                ),
                redeemed: fc.oneof(
                  fc.integer({ min: 0, max: 10_000 }),
                  fc.string({ minLength: 0, maxLength: 10 }),
                ),
                redeemedOverdue: fc.oneof(
                  fc.integer({ min: 0, max: 10_000 }),
                  fc.string({ minLength: 0, maxLength: 10 }),
                ),
                totalOverallSales: fc.string({ minLength: 0, maxLength: 20 }),
                branchSales: fc.option(fc.integer({ min: 0, max: 1_000_000 }), {
                  nil: undefined,
                }),
                allBranchSales: fc.option(
                  fc.integer({ min: 0, max: 1_000_000 }),
                  { nil: undefined },
                ),
              }),
              { nil: undefined },
            ),
            (data) => {
              const { container } = render(<OverallSummaryStats data={data} />);

              // The outermost element is the grid container div
              const gridEl = container.firstElementChild as HTMLElement;
              expect(gridEl).not.toBeNull();

              const classes = gridEl.className;

              // Must have sm:grid-cols-2 (2-column layout at sm breakpoint / mobile baseline)
              expect(classes).toContain("sm:grid-cols-2");
            },
          ),
          { numRuns: 100 },
        );
      },
    );
  });
});
