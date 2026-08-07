/** Resolve a canvas design for a Settings document type from moa_template. */

import type { MoaDocumentType } from "@/app/(pages)/settings/_components/moa-design-palette";
import type { MoaDesignBlob } from "./design-blob";
import { hasMoaDesign, normalizeMoaDesignBlob } from "./design-blob";
import {
  createBuyBackDesign,
  createDefaultMoaDesign,
  createPawnRenewalDesign,
  createRedemptionDesign,
} from "./default-design";

export type MoaTemplateDesignSource = {
  design?: MoaDesignBlob | null;
  document_designs?: Partial<Record<MoaDocumentType, MoaDesignBlob | null>> | null;
  category_templates?: Record<
    string,
    {
      design?: MoaDesignBlob | null;
      document_designs?: Partial<Record<MoaDocumentType, MoaDesignBlob | null>> | null;
    }
  > | null;
};

export function builtinDesignFor(documentType: MoaDocumentType): MoaDesignBlob {
  switch (documentType) {
    case "renewal":
      return createPawnRenewalDesign();
    case "redeem":
      return createRedemptionDesign();
    case "buy_back":
      return createBuyBackDesign();
    case "moa":
    default:
      return createDefaultMoaDesign();
  }
}

function findCategoryTemplate(
  template: MoaTemplateDesignSource,
  category: string,
) {
  const key = Object.keys(template.category_templates ?? {}).find(
    (item) => item.trim().toLowerCase() === category.trim().toLowerCase(),
  );
  return key ? template.category_templates?.[key] : undefined;
}

function normalizeSaved(
  preferred: MoaDesignBlob | null | undefined,
  fallback?: MoaDesignBlob | null,
): MoaDesignBlob | null {
  if (preferred && hasMoaDesign(preferred)) {
    return normalizeMoaDesignBlob(preferred);
  }
  if (fallback && hasMoaDesign(fallback)) {
    return normalizeMoaDesignBlob(fallback);
  }
  return null;
}

/**
 * Saved design only (API / template). Returns null when nothing is stored —
 * does not fall back to builtin templates.
 */
export function pickSavedDocumentDesign(
  template: MoaTemplateDesignSource | null | undefined,
  documentType: MoaDocumentType,
  category = "",
): MoaDesignBlob | null {
  if (!template) return null;

  const tryCategory = (cat: string): MoaDesignBlob | null => {
    const categoryTemplate = cat ? findCategoryTemplate(template, cat) : undefined;

    if (documentType === "moa") {
      return normalizeSaved(categoryTemplate?.design, template.design);
    }

    return normalizeSaved(
      categoryTemplate?.document_designs?.[documentType],
      template.document_designs?.[documentType],
    );
  };

  const cats = [category, "__default__", ""]
    .map((c) => c.trim())
    .filter((value, index, arr) => arr.indexOf(value) === index);

  for (const cat of cats) {
    const found = tryCategory(cat);
    if (found) return found;
  }

  if (documentType === "moa") {
    return normalizeSaved(template.design);
  }
  return normalizeSaved(template.document_designs?.[documentType]);
}

/**
 * Prefer saved template design, else builtin starter for that document type.
 */
export function pickDocumentDesign(
  template: MoaTemplateDesignSource | null | undefined,
  documentType: MoaDocumentType,
  category = "",
): MoaDesignBlob {
  return (
    pickSavedDocumentDesign(template, documentType, category) ??
    builtinDesignFor(documentType)
  );
}
