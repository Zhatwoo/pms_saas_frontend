"use client";

/** Read-only MOA design pages for employee print / preview.
 *  Print runs in a bare iframe (no Tailwind) — all layout must be inline styles.
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

function PrintElement({
  element,
  values,
  branch,
}: {
  element: MoaDesignElement;
  values: MoaFieldValueContext;
  branch: MoaBranchPreview;
}) {
  const textStyle = {
    fontFamily: element.fontFamily,
    fontSize: element.fontSize,
    textAlign: element.textAlign,
    fontWeight: element.fontWeight,
    fontStyle: element.fontStyle,
    textDecoration: element.textDecoration,
    color: element.color,
    lineHeight: element.lineHeight,
  } as const;

  const boxStyle: CSSProperties = {
    position: "absolute",
    left: element.x,
    top: element.y,
    width: element.width,
    height: element.height,
    boxSizing: "border-box",
    overflow: "hidden",
  };

  if (element.kind === "header") {
    return (
      <div
        style={{
          ...boxStyle,
          border:
            element.stroke && element.stroke !== "transparent"
              ? `1px solid ${element.stroke}`
              : "1px solid #d4d4d8",
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
          <div style={{ ...textStyle, padding: "4px 8px" }}>{element.text}</div>
        ) : null}
      </div>
    );
  }

  if (element.kind === "moaField") {
    const value = resolveMoaFieldValue(element.fieldKey, values);
    const display =
      value === "—" && element.fieldKey === "witnessName" ? "\u00A0" : value;
    return (
      <div
        style={{
          ...boxStyle,
          display: "flex",
          alignItems: "flex-end",
          gap: 6,
          padding: "4px 6px",
        }}
      >
        <span
          style={{
            ...textStyle,
            flexShrink: 0,
            fontWeight: 600,
            whiteSpace: "nowrap",
          }}
        >
          {element.text || element.fieldKey}:
        </span>
        <span
          style={{
            ...textStyle,
            flex: "1 1 0%",
            minWidth: 0,
            fontWeight: "normal",
            borderBottom: "1px solid #52525b",
            paddingBottom: 1,
            lineHeight: 1.2,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {display}
        </span>
      </div>
    );
  }

  if (
    isPageDoc(element) ||
    element.kind === "text" ||
    element.kind === "body" ||
    element.kind === "section"
  ) {
    return (
      <div
        style={{
          ...boxStyle,
          ...textStyle,
          whiteSpace: "pre-wrap",
          paddingLeft: 4 + (element.indent ?? 0) * 24,
          paddingRight: 4,
        }}
      >
        {fillMoaPlaceholders(element.text || "", values)}
      </div>
    );
  }

  if (element.kind === "photo") {
    return (
      <div style={boxStyle}>
        {element.imageSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={element.imageSrc}
            alt=""
            style={{
              width: "100%",
              height: "100%",
              objectFit: element.imageFit || "contain",
              display: "block",
            }}
          />
        ) : null}
      </div>
    );
  }

  // Shapes / table / chart / etc. — reuse editor visual (read-only)
  return (
    <div style={boxStyle}>
      <MoaElementVisual element={element} />
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
            className="moa-print-page moa-design-print-page"
            data-moa-design-page="true"
            data-screen-width={page.screenWidthPx}
            data-screen-height={page.screenHeightPx}
            style={{
              width: page.screenWidthPx,
              height: page.screenHeightPx,
              maxWidth: page.screenWidthPx,
              maxHeight: page.screenHeightPx,
              padding: 0,
              margin: "0 auto",
              boxSizing: "border-box",
              position: "relative",
              overflow: "hidden",
              background: "#fff",
              color: "#27272a",
              fontSize: 9.5,
              lineHeight: 1.25,
              border: "1px solid #d4d4d8",
            }}
          >
            <div
              style={{
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                boxSizing: "border-box",
                padding: marginsToPadding(design.margins),
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
                  {pageDoc.text}
                </div>
              ) : null}
              <div
                style={{
                  position: "relative",
                  zIndex: 2,
                  width: "100%",
                  height: "100%",
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
          </div>
        );
      })}
    </>
  );
}
