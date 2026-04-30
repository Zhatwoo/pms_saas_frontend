/**
 * Property-based tests for StatCard component responsiveness.
 *
 * Feature: system-responsiveness
 * Properties tested:
 *   - Property 6: StatCard value text is responsive
 */

import React from "react";
import { render } from "@testing-library/react";
import * as fc from "fast-check";

import { StatCard } from "@/components/shared/stat-card";

// ── Tests ──────────────────────────────────────────────────────────────────

describe("StatCard responsive classes", () => {
  /**
   * Property 6: StatCard value text is responsive
   *
   * Validates: Requirements 5.4
   * Tag: Feature: system-responsiveness, Property 6: StatCard value text is responsive
   *
   * For any StatCard instance with any value and label, the value text element
   * shall have `text-2xl` as its base class and `sm:text-4xl` as its responsive
   * override, ensuring the value scales down on mobile to prevent overflow.
   */
  describe("Property 6: StatCard value text is responsive", () => {
    it(
      // Tag: Feature: system-responsiveness, Property 6: StatCard value text is responsive
      "value <p> element has text-2xl and sm:text-4xl for any value and label",
      () => {
        fc.assert(
          fc.property(
            // Generate arbitrary values — strings and integers
            fc.oneof(
              fc.string({ minLength: 0, maxLength: 50 }),
              fc.integer({ min: -1_000_000, max: 1_000_000 }),
            ),
            // Generate arbitrary labels
            fc.string({ minLength: 0, maxLength: 100 }),
            (value, label) => {
              const { container } = render(
                <StatCard value={value} label={label} />,
              );

              // The value is rendered in a <p> element that contains the value text.
              // It is the second <p> inside the component (first is the label).
              // We identify it by querying all <p> elements and finding the one
              // whose textContent matches the rendered value.
              const allParagraphs = Array.from(container.querySelectorAll("p"));

              // The value paragraph is the one that contains the value text.
              // For numbers, React renders them as strings.
              const valueStr = String(value);
              const valueParagraph = allParagraphs.find(
                (p) => p.textContent === valueStr,
              );

              expect(valueParagraph).toBeDefined();
              expect(valueParagraph!.className).toContain("text-2xl");
              expect(valueParagraph!.className).toContain("sm:text-4xl");
            },
          ),
          { numRuns: 100 },
        );
      },
    );
  });
});
