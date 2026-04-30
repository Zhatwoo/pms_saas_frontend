/**
 * Property-based tests for DataTable component responsiveness.
 *
 * Feature: system-responsiveness
 * Properties tested:
 *   - Property 5: DataTable horizontal overflow is contained
 */

import React from "react";
import { render } from "@testing-library/react";
import * as fc from "fast-check";

import { DataTable } from "@/components/shared/data-table";

// ── Arbitraries ────────────────────────────────────────────────────────────

/**
 * Generates a valid column key: a non-empty alphanumeric string.
 * Using alphanumeric keys avoids collisions and keeps data row generation simple.
 */
const columnKeyArb = fc
  .string({ minLength: 1, maxLength: 20 })
  .filter((s) => s.trim().length > 0);

/**
 * Generates an array of 1–20 column definitions with unique keys.
 */
const columnsArb = fc
  .array(
    fc.record({
      key: columnKeyArb,
      label: fc.string({ minLength: 0, maxLength: 40 }),
    }),
    { minLength: 1, maxLength: 20 },
  )
  .map((cols) => {
    // Deduplicate keys to avoid React key warnings and ensure valid table structure
    const seen = new Set<string>();
    return cols.filter((col) => {
      if (seen.has(col.key)) return false;
      seen.add(col.key);
      return true;
    });
  })
  .filter((cols) => cols.length >= 1);

// ── Tests ──────────────────────────────────────────────────────────────────

describe("DataTable responsive classes", () => {
  /**
   * Property 5: DataTable horizontal overflow is contained
   *
   * Validates: Requirements 4.1, 4.3, 4.5
   * Tag: Feature: system-responsiveness, Property 5: DataTable horizontal overflow is contained
   *
   * For any DataTable instance with any number of columns (1–20), the outer
   * container shall have `overflow-hidden` and the inner wrapper shall have
   * `overflow-x-auto`, ensuring horizontal overflow is contained within the
   * table's own scroll region and does not propagate to the page body.
   */
  describe("Property 5: DataTable horizontal overflow is contained", () => {
    it(
      // Tag: Feature: system-responsiveness, Property 5: DataTable horizontal overflow is contained
      "outer container has overflow-hidden and inner wrapper has overflow-x-auto for any column count",
      () => {
        fc.assert(
          fc.property(columnsArb, (columns) => {
            // Build matching data rows so the table renders with actual content
            const dataRow: Record<string, string> = {};
            for (const col of columns) {
              dataRow[col.key] = `value-${col.key}`;
            }

            const { container } = render(
              <DataTable columns={columns} data={[dataRow]} />,
            );

            // The DataTable renders:
            //   <div className="overflow-hidden ...">   ← outer container
            //     <div className="overflow-x-auto">     ← inner wrapper
            //       <table ...>
            const outerDiv = container.firstElementChild as HTMLElement;
            expect(outerDiv).not.toBeNull();
            expect(outerDiv.className).toContain("overflow-hidden");

            // The inner wrapper is the first child of the outer div
            const innerDiv = outerDiv.firstElementChild as HTMLElement;
            expect(innerDiv).not.toBeNull();
            expect(innerDiv.className).toContain("overflow-x-auto");
          }),
          { numRuns: 100 },
        );
      },
    );
  });
});
