import type { ReactNode } from "react";
import { LoadingSpinnerLabel } from "./loading-spinner-label";

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
  onRowClick?: (row: Record<string, any>, rowIndex: number) => void;
  isLoading?: boolean;
  loadingMessage?: string;
}

export function DataTable({
  columns,
  data,
  renderCell,
  headerClassName = "bg-pawn-sidebar text-pawn-gold",
  tableClassName,
  emptyMessage = "No records found.",
  rowClassName,
  onRowClick,
  isLoading = false,
  loadingMessage = "Loading data...",
}: DataTableProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-border-main bg-surface shadow-lg shadow-black/20 transition-colors duration-300">
      <div className="overflow-x-auto">
        <table className={`w-full text-base ${tableClassName ?? ""}`.trim()}>
          <thead>
            <tr className={headerClassName}>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`whitespace-nowrap px-3 py-2 sm:px-4 sm:py-3 text-xs font-bold uppercase tracking-wide ${
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
            {isLoading ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-12 text-center text-base text-text-tertiary"
                >
                  <div className="flex items-center justify-center">
                    <LoadingSpinnerLabel text={loadingMessage} className="text-base font-medium text-text-tertiary" />
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-12 text-center text-base text-text-tertiary"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row, idx) => (
                <tr
                  key={idx}
                  onClick={() => onRowClick?.(row, idx)}
                  className={`border-t border-border-subtle transition-colors bg-surface-secondary hover:bg-emerald-surface/60 ${
                    onRowClick ? "cursor-pointer" : ""
                  } ${rowClassName?.(row, idx) ?? ""}`.trim()}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`whitespace-nowrap px-3 py-2 sm:px-4 sm:py-3 text-sm text-text-secondary ${
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
