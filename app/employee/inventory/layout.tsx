"use client";

import { usePathname } from "next/navigation";

export default function EmployeeInventoryLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPawned = pathname?.includes("pawned-items") ?? false;

  return (
    <div className="space-y-4 p-4">
      {/* Breadcrumb + Title */}
      <div>
        <p className="text-xs text-zinc-400">
          Inventory &gt;{" "}
          <span className="text-zinc-700 font-medium">
            {isPawned ? "Pawned Items" : "Items For Sale"}
          </span>
        </p>
        <h1 className="text-xl font-bold text-emerald-900 leading-tight mt-0.5">
          {isPawned ? "Pawned Items" : "Items For Sale"}
        </h1>
      </div>

      {/* Page Content */}
      <div className="mt-4">
        {children}
      </div>
    </div>
  );
}
