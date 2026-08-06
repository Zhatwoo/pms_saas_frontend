/** Field keys placed on the MOA canvas (`moaField` elements) — drives New Pawn inputs. */

import type { MoaDesignBlob } from "./design-blob";

const PAGE_DOC_FIELD_KEY = "__pageDoc__";

/** Unique `fieldKey` values from canvas moaField elements (excludes page typing surface). */
export function collectMoaCanvasFieldKeys(
  design?: MoaDesignBlob | null,
): ReadonlySet<string> {
  if (!design?.elements?.length) return new Set();

  const keys = design.elements
    .filter(
      (el) =>
        el.kind === "moaField" &&
        typeof el.fieldKey === "string" &&
        el.fieldKey.length > 0 &&
        el.fieldKey !== PAGE_DOC_FIELD_KEY,
    )
    .map((el) => el.fieldKey);

  return new Set(keys);
}

export function moaCanvasHasFieldKeys(design?: MoaDesignBlob | null): boolean {
  return collectMoaCanvasFieldKeys(design).size > 0;
}
