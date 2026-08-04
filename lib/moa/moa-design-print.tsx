"use client";

/**
 * Read-only MOA design pages for employee print / preview.
 * Paper + absolute layer match Settings Slip Edit canvas so layout stays identical.
 * Print iframe has no Tailwind — critical box layout uses inline styles;
 * MoaElementVisual still needs host-page Tailwind for screen preview (same as Edit).
 */

import type { CSSProperties } from "react";
import {
  MOA_PAGE_SIZES,
  MoaCanvasWatermark,
  MOA_PAGE_DOC_FIELD_KEY,
  resolveHeaderFieldValue,
  type MoaBranchPreview,
  type MoaDesignElement,
} from "@/app/(pages)/settings/_components/moa-design-palette";
import { marginsToPadding } from "@/app/(pages)/settings/_components/moa-design/docs-ruler";
import { MoaElementVisual } from "@/app/(pages)/settings/_components/moa-design/elements/visuals";
import type { MoaDesignBlob } from "./design-blob";
import {
  fillMoaPlaceholders,
  resolveMoaFieldValue,
  type MoaFieldValueContext,
} from "./resolve-field-values";

function isPageDoc(el: MoaDesignElement) {
  return el.kind === "body" && el.fieldKey === MOA_PAGE_DOC_FIELD_KEY;
}

function PrintHeader({
  element,
  branch,
}: {
  element: MoaDesignElement;
  branch: MoaBranchPreview;
}) {
  const hasStroke =
    Boolean(element.stroke) &&
    element.stroke !== "transparent" &&
    element.stroke !== "#d4d4d8" &&
    element.stroke !== "#e4e4e7";

  return (
    <div
      data-moa-design-el={element.id}
      style={{
        position: "absolute",
        left: element.x,
        top: element.y,
        width: element.width,
        height: element.height,
        boxSizing: "border-box",
        overflow: "hidden",
        border: hasStroke ? `1px solid ${element.stroke}` : "none",
        background:
          element.fill && element.fill !== "transparent" ? element.fill : "transparent",
      }}
    >
      {element.headerFields.map((field) => (
        <div
          key={field.id}
          style={{
            position: "absolute",
            left: field.x,
            top: field.y,
            width: field.width,
            height: field.height || 22,
            overflow: "hidden",
            wordBreak: "break-word",
            lineHeight: 1.2,
            fontFamily: field.fontFamily ?? element.fontFamily,
            fontSize: field.fontSize ?? element.fontSize,
            fontWeight: field.fontWeight ?? element.fontWeight,
            fontStyle: field.fontStyle ?? element.fontStyle,
            textDecoration: field.textDecoration ?? element.textDecoration,
            color: field.color ?? element.color,
            textAlign: field.textAlign ?? element.textAlign,
          }}
        >
          {resolveHeaderFieldValue(field.key, branch)}
        </div>
      ))}
      {element.text ? (
        <div
          style={{
            position: "absolute",
            left: 8,
            right: 8,
            bottom: 8,
            fontFamily: element.fontFamily,
            fontSize: element.fontSize,
            fontWeight: element.fontWeight,
            fontStyle: element.fontStyle,
            textDecoration: element.textDecoration,
            color: element.color,
            textAlign: element.textAlign,
            whiteSpace: "pre-wrap",
          }}
        >
          {element.text}
        </div>
      ) : null}
    </div>
  );
}

function PrintElement({
  element,
  values,
  branch,
}: {
  element: MoaDesignElement;
  values: MoaFieldValueContext;
  branch: MoaBranchPreview;
}) {
  if (element.kind === "header") {
    return <PrintHeader element={element} branch={branch} />;
  }

  const boxStyle: CSSProperties = {
    position: "absolute",
    left: element.x,
    top: element.y,
    width: element.width,
    height: element.height,
    boxSizing: "border-box",
    overflow: "hidden",
  };

  // Same visual components as Slip Edit canvas (keeps spacing/borders identical).
  const visualElement: MoaDesignElement =
    element.kind === "text" || element.kind === "body" || element.kind === "section"
      ? {
          ...element,
          text: fillMoaPlaceholders(element.text || "", values),
        }
      : element;

  return (
    <div data-moa-design-el={element.id} style={boxStyle}>
      <MoaElementVisual
        element={visualElement}
        forPrint
        resolveFieldValue={(fieldKey) => resolveMoaFieldValue(fieldKey, values)}
      />
    </div>
  );
}

export function MoaDesignPrintPages({
  design,
  values,
}: {
  design: MoaDesignBlob;
  values: MoaFieldValueContext;
}) {
  const page = MOA_PAGE_SIZES[design.pageSizeId] ?? MOA_PAGE_SIZES.long;
  const pageCount = Math.max(1, design.pageCount || 1);
  const branch: MoaBranchPreview = {
    shopName: values.shopName,
    shopAddress: values.shopAddress,
    phoneNumber: values.phoneNumber,
    email: values.email,
  };

  return (
    <>
      {Array.from({ length: pageCount }, (_, pageIndex) => {
        const pageElements = design.elements.filter(
          (el) => (el.pageIndex ?? 0) === pageIndex && !isPageDoc(el),
        );
        const pageDoc = design.elements.find(
          (el) => (el.pageIndex ?? 0) === pageIndex && isPageDoc(el),
        );

        return (
          <div
            key={`design-page-${pageIndex}`}
            className="moa-print-page moa-design-print-page moa-paper-effect"
            data-moa-design-page="true"
            data-screen-width={page.screenWidthPx}
            data-screen-height={page.screenHeightPx}
            style={{
              // Match Settings Slip Edit paper box exactly.
              width: page.screenWidthPx,
              height: page.screenHeightPx,
              maxWidth: page.screenWidthPx,
              maxHeight: page.screenHeightPx,
              padding: marginsToPadding(design.margins),
              boxSizing: "border-box",
              position: "relative",
              overflow: "hidden",
              background: "#fff",
              color: "#27272a",
              fontSize: 9.5,
              lineHeight: 1.25,
              border: "none",
              boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
              marginLeft: "auto",
              marginRight: "auto",
              marginBottom: pageIndex < pageCount - 1 ? 24 : 0,
            }}
          >
            <MoaCanvasWatermark settings={design.watermark} />
            {pageDoc?.text ? (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  zIndex: 1,
                  overflow: "hidden",
                  whiteSpace: "pre-wrap",
                  padding: 12,
                  paddingLeft: 12 + (pageDoc.indent ?? 0) * 24,
                  fontFamily: pageDoc.fontFamily,
                  fontSize: pageDoc.fontSize,
                  fontWeight: pageDoc.fontWeight,
                  fontStyle: pageDoc.fontStyle,
                  textDecoration: pageDoc.textDecoration,
                  color: pageDoc.color,
                  textAlign: pageDoc.textAlign,
                  lineHeight: pageDoc.lineHeight,
                }}
              >
                {fillMoaPlaceholders(pageDoc.text, values)}
              </div>
            ) : null}
            {/* Same absolute inset-0 canvas layer as MoaDesignCanvasLayer */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                zIndex: 2,
                overflow: "hidden",
              }}
            >
              {pageElements.map((el) => (
                <PrintElement
                  key={el.id}
                  element={el}
                  values={values}
                  branch={branch}
                />
              ))}
            </div>
          </div>
        );
      })}
    </>
  );
}
