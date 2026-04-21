"use client";

import { useState, useRef, useEffect } from "react";
import { StatusBadge } from "@/components/shared/status-badge";
import { AlertBanner } from "@/components/shared/alert-banner";
import { PaginationFooter } from "@/components/shared/pagination";
import { DataTable } from "@/components/shared/data-table";
import type { Column } from "@/components/shared/data-table";

const columns: Column[] = [
  { key: "itemId", label: "Item ID" },
  { key: "itemName", label: "Item Name" },
  { key: "category", label: "Category" },
  { key: "branch", label: "Branch" },
  { key: "pawnDate", label: "Pawn Date" },
  { key: "status", label: "Status" },
  { key: "stockLevel", label: "Stock Level", align: "center" },
  { key: "actions", label: "Actions", align: "center" },
];

const inventoryItems = [
  {
    itemId: "ITM-001",
    itemName: "Laptop Lenovo",
    category: "Electronics",
    branch: "Taguig",
    pawnDate: "Mar 01, 2026",
    status: "Pawned",
    stockLevel: 10,
  },
  {
    itemId: "ITM-002",
    itemName: "Laptop Lenovo",
    category: "Jewellery",
    branch: "Makati",
    pawnDate: "Mar 02, 2026",
    status: "Pawned",
    stockLevel: 10,
  },
  {
    itemId: "ITM-003",
    itemName: "Laptop Lenovo",
    category: "Electronics",
    branch: "Pasay",
    pawnDate: "Mar 03, 2026",
    status: "Pawned",
    stockLevel: 10,
  },
  {
    itemId: "ITM-004",
    itemName: "Laptop Lenovo",
    category: "Jewellery",
    branch: "Taguig",
    pawnDate: "Mar 04, 2026",
    status: "Pawned",
    stockLevel: 10,
  },
  {
    itemId: "ITM-005",
    itemName: "Laptop Lenovo",
    category: "Electronics",
    branch: "Makati",
    pawnDate: "Mar 05, 2026",
    status: "Pawned",
    stockLevel: 10,
  },
  {
    itemId: "ITM-006",
    itemName: "Laptop Lenovo",
    category: "Jewellery",
    branch: "Pasay",
    pawnDate: "Mar 06, 2026",
    status: "Pawned",
    stockLevel: 10,
  },
];

const warningIcon = (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

function StockLevelBadge({ level }: { level: number }) {
  let bgColor = "bg-green-100 text-green-700";
  if (level <= 3) {
    bgColor = "bg-red-100 text-red-600";
  } else if (level <= 5) {
    bgColor = "bg-yellow-100 text-yellow-700";
  }

  return (
    <span
      className={`inline-block rounded px-2.5 py-1 text-xs font-bold ${bgColor}`}
    >
      {level} pcs
    </span>
  );
}

function ActionsDropdown({ itemId }: { itemId: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative inline-block">
      <button
        onClick={() => setOpen(!open)}
        className="flex h-8 w-8 items-center justify-center rounded-md text-text-tertiary transition-colors hover:bg-surface-hover"
        title={`Actions for ${itemId}`}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <circle cx="12" cy="5" r="2" />
          <circle cx="12" cy="12" r="2" />
          <circle cx="12" cy="19" r="2" />
        </svg>
      </button>
      {open && (
        <div className="absolute right-0 z-10 mt-1 w-28 rounded-lg border border-border-main bg-surface py-1 shadow-lg">
          <button
            onClick={() => setOpen(false)}
            className="w-full px-3 py-2 text-left text-sm text-text-secondary hover:bg-surface-hover"
          >
            View
          </button>
          <button
            onClick={() => setOpen(false)}
            className="w-full px-3 py-2 text-left text-sm text-text-secondary hover:bg-surface-hover"
          >
            Edit
          </button>
          <button
            onClick={() => setOpen(false)}
            className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

export function InventoryTable() {
  const [currentPage, setCurrentPage] = useState(6);

  return (
    <div className="space-y-4">
      {/* Low stock alert */}
      <AlertBanner
        variant="warning"
        icon={warningIcon}
        message="12 items are low in stock"
        rightContent={
          <button className="text-sm font-semibold text-amber-800 hover:underline">
            View All &gt;
          </button>
        }
      />

      {/* Table */}
      <DataTable
        columns={columns}
        data={inventoryItems}
        renderCell={(key, value, row) => {
          if (key === "status") {
            return <StatusBadge label={value} variant="yellow" />;
          }
          if (key === "stockLevel") {
            return <StockLevelBadge level={value} />;
          }
          if (key === "actions") {
            return <ActionsDropdown itemId={row.itemId} />;
          }
          return value;
        }}
      />

      {/* Pagination */}
      <div className="overflow-hidden rounded-lg border border-border-main bg-surface transition-colors duration-300">
        <PaginationFooter
          currentPage={currentPage}
          totalPages={7}
          totalItems={22}
          itemsPerPage={6}
          onPageChange={setCurrentPage}
          className="border-t-0"
        />
      </div>
    </div>
  );
}
