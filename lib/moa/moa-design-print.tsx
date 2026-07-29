"use client";

/** Read-only MOA design pages for employee print / preview. */

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
  const style = {
    fontFamily: element.fontFamily,
    fontSize: element.fontSize,
    textAlign: element.textAlign,
    fontWeight: element.fontWeight,
    fontStyle: element.fontStyle,
    textDecoration: element.textDecoration,
    color: element.color,
    lineHeight: element.lineHeight,
  } as const;

  if (element.kind === "header") {
    return (
      <div
        className="absolute overflow-hidden rounded border"
        style={{
          left: element.x,
          top: element.y,
          width: element.width,
          height: element.height,
          borderColor: element.stroke || "#d4d4d8",
          background:
            element.fill && element.fill !== "transparent" ? element.fill : "transparent",
        }}
      >
        {element.headerFields.map((field) => (
          <div
            key={field.id}
            className="absolute overflow-hidden break-words leading-tight"
            style={{
              left: field.x,
              top: field.y,
              width: field.width,
              height: field.height || 22,
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
          <div className="px-2 py-1" style={style}>
            {element.text}
          </div>
        ) : null}
      </div>
    );
  }

  if (element.kind === "moaField") {
    const value = resolveMoaFieldValue(element.fieldKey, values);
    return (
      <div
        className="absolute flex items-end gap-1.5 overflow-hidden px-1"
        style={{
          left: element.x,
          top: element.y,
          width: element.width,
          height: element.height,
        }}
      >
        <span className="shrink-0 font-semibold whitespace-nowrap" style={style}>
          {element.text || element.fieldKey}:
        </span>
        <span
          className="min-w-0 flex-1 truncate border-b border-zinc-500 pb-0.5"
          style={{ ...style, fontWeight: "normal" }}
        >
          {value}
        </span>
      </div>
    );
  }

  if (isPageDoc(element) || element.kind === "text" || element.kind === "body" || element.kind === "section") {
    return (
      <div
        className="absolute overflow-hidden whitespace-pre-wrap px-1"
        style={{
          left: element.x,
          top: element.y,
          width: element.width,
          height: element.height,
          ...style,
          paddingLeft: 4 + (element.indent ?? 0) * 24,
        }}
      >
        {element.text}
      </div>
    );
  }

  // Shapes / photo / table / chart / etc. — reuse editor visual (read-only)
  return (
    <div
      className="absolute overflow-hidden"
      style={{
        left: element.x,
        top: element.y,
        width: element.width,
        height: element.height,
      }}
    >
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
            className="moa-print-page moa-design-print-page mx-auto w-full min-w-0 flex-none overflow-hidden border border-zinc-300 bg-white text-[9.5px] leading-normal text-zinc-800 shadow-md moa-paper-effect"
            style={{
              width: page.screenWidthPx,
              height: page.screenHeightPx,
              maxWidth: page.screenWidthPx,
              maxHeight: page.screenHeightPx,
              padding: 0,
              boxSizing: "border-box",
              position: "relative",
            }}
          >
            <div
              className="relative h-full w-full overflow-hidden"
              style={{
                padding: marginsToPadding(design.margins),
                boxSizing: "border-box",
              }}
            >
              <MoaCanvasWatermark settings={design.watermark} />
              {pageDoc?.text ? (
                <div
                  className="absolute inset-0 z-[1] overflow-hidden whitespace-pre-wrap px-3 py-3"
                  style={{
                    fontFamily: pageDoc.fontFamily,
                    fontSize: pageDoc.fontSize,
                    fontWeight: pageDoc.fontWeight,
                    fontStyle: pageDoc.fontStyle,
                    textDecoration: pageDoc.textDecoration,
                    color: pageDoc.color,
                    textAlign: pageDoc.textAlign,
                    lineHeight: pageDoc.lineHeight,
                    paddingLeft: 12 + (pageDoc.indent ?? 0) * 24,
                  }}
                >
                  {pageDoc.text}
                </div>
              ) : null}
              <div className="relative z-[2] h-full w-full">
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
