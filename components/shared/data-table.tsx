/* eslint-disable @typescript-eslint/no-explicit-any -- Rows are heterogeneous per screen; columns are dynamic string keys. */
import type { ReactNode } from "react";

export interface Column {
  key: string;
  label: string;
  align?: "left" | "center" | "right";
}

interface DataTableProps {
  columns: Column[];
  data: Record<string, any>[];
  renderCell?: (
    key: string,
    value: any,
    row: Record<string, any>,
    rowIndex: number,
  ) => ReactNode;
  headerClassName?: string;
  tableClassName?: string;
  emptyMessage?: ReactNode;
  rowClassName?: (row: Record<string, any>, rowIndex: number) => string;
}

export function DataTable({
  columns,
  data,
  renderCell,
  headerClassName = "bg-emerald-900 text-amber-400",
  tableClassName,
  emptyMessage = "No records found.",
  rowClassName,
}: DataTableProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-border-main bg-surface transition-colors duration-300">
      <div className="overflow-x-auto">
        <table className={`w-full text-sm ${tableClassName ?? ""}`.trim()}>
          <thead>
            <tr className={headerClassName}>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`whitespace-nowrap px-3 py-2 text-[10px] font-bold uppercase tracking-wide ${
                    col.align === "center"
                      ? "text-center"
                      : col.align === "right"
                        ? "text-right"
                        : "text-left"
                  }`}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-10 text-center text-sm text-text-tertiary"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row, idx) => (
                <tr
                  key={idx}
                  className={`border-t border-border-subtle ${
                    idx % 2 === 0 ? "bg-surface" : "bg-surface-secondary"
                  } ${rowClassName?.(row, idx) ?? ""}`.trim()}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`whitespace-nowrap px-3 py-2 text-xs text-text-secondary ${
                        col.align === "center"
                          ? "text-center"
                          : col.align === "right"
                            ? "text-right"
                            : "text-left"
                      }`}
                    >
                      {renderCell
                        ? renderCell(col.key, row[col.key], row, idx)
                        : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
