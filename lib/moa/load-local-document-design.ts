/** Load a full design blob from the same localStorage keys Slip Edit uses. */

import {
  loadMoaDesignElements,
  loadMoaMargins,
  loadMoaPageCount,
  loadMoaPageSize,
  loadMoaWatermark,
  moaDesignStorageKey,
  type MoaDocumentType,
} from "@/app/(pages)/settings/_components/moa-design-palette";
import { defaultMarginsForPage } from "@/app/(pages)/settings/_components/moa-design/docs-ruler";
import type { MoaDesignBlob } from "./design-blob";
import { hasMoaDesign } from "./design-blob";
import {
  builtinDesignFor,
  pickSavedDocumentDesign,
  type MoaTemplateDesignSource,
} from "./pick-document-design";

export function loadDocumentDesignFromLocalStorage(
  documentType: MoaDocumentType,
  category: string,
): MoaDesignBlob | null {
  if (typeof window === "undefined") return null;
  const storageKey = moaDesignStorageKey(documentType, category || "__default__");
  const elements = loadMoaDesignElements(storageKey);
  if (!elements.length) return null;

  const pageSizeId = loadMoaPageSize(storageKey);
  return {
    elements,
    pageSizeId,
    pageCount: loadMoaPageCount(storageKey, elements),
    watermark: loadMoaWatermark(storageKey),
    margins: loadMoaMargins(storageKey, defaultMarginsForPage(pageSizeId)),
  };
}

/**
 * Resolve design in the same order Slip Edit effectively uses:
 * saved API → localStorage (category / default) → builtin.
 */
export function resolveEmployeeDocumentDesign(
  template: MoaTemplateDesignSource | null | undefined,
  documentType: MoaDocumentType,
  category: string,
): MoaDesignBlob {
  const fromApi = pickSavedDocumentDesign(template, documentType, category);
  if (fromApi && hasMoaDesign(fromApi)) return fromApi;

  const cats = [category, "__default__"].filter(
    (value, index, arr) =>
      Boolean(value?.trim()) &&
      arr.findIndex((item) => item.trim().toLowerCase() === value.trim().toLowerCase()) ===
        index,
  );

  for (const cat of cats) {
    const fromLs = loadDocumentDesignFromLocalStorage(documentType, cat);
    if (fromLs && hasMoaDesign(fromLs)) return fromLs;
  }

  return builtinDesignFor(documentType);
}
