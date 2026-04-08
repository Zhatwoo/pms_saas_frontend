import type { ReactNode } from "react";

export interface Column {
  key: string;
  label: string;
  align?: "left" | "center" | "right";
}

interface DataTableProps {
  columns: Column[];
  data: Record<string, any>[];
  renderCell?: (key: string, value: any, row: Record<string, any>) => ReactNode;
  headerClassName?: string;
}

export function DataTable({
  columns,
  data,
  renderCell,
  headerClassName = "bg-emerald-900 text-amber-400",
}: DataTableProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-border-main bg-surface transition-colors duration-300">
      <table className="w-full text-sm">
        <thead>
          <tr className={headerClassName}>
            {columns.map((col) => (
              <th
                key={col.key}
                className={`px-3 py-2 text-[10px] font-bold uppercase tracking-wide ${
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
          {data.map((row, idx) => (
            <tr
              key={idx}
              className={`border-t border-border-subtle ${idx % 2 === 0 ? "bg-surface" : "bg-surface-secondary"}`}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={`px-3 py-2 text-xs text-text-secondary ${
                    col.align === "center"
                      ? "text-center"
                      : col.align === "right"
                        ? "text-right"
                        : "text-left"
                  }`}
                >
                  {renderCell
                    ? renderCell(col.key, row[col.key], row)
                    : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
