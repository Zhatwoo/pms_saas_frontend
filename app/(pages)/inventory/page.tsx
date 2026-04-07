"use client";

import { InventoryFilters } from "./_components/inventory-filters";
import { InventoryTable } from "./_components/inventory-table";

export default function InventoryPage() {
  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs text-zinc-400">
          Inventory &gt; <span className="text-zinc-600">Pawned Items</span>
        </p>
        <p className="mt-1 text-sm text-zinc-500">
          Track and manage inventory items.
        </p>
      </div>

      <InventoryFilters />
      <InventoryTable />
    </div>
  );
}
