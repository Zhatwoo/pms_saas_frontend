"use client";

import { usePathname } from "next/navigation";
import { useOpeningChecklist } from "@/contexts/opening-checklist-context";
import { InventoryAuditModal } from "@/components/shared/inventory-audit-modal";

export default function EmployeeInventoryLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPawned = pathname?.includes("pawned-items") ?? false;
  const { isComplete, completeInventoryAudit } = useOpeningChecklist();

  if (!isComplete) {
    return (
      <div className="flex min-h-[calc(100svh-8rem)] items-center justify-center overflow-auto px-3 py-3 sm:px-4 sm:py-4">
        <div className="h-[88vh] w-full max-w-[1440px] overflow-auto rounded-[1.75rem] border border-white/10 bg-surface shadow-2xl">
          <InventoryAuditModal
            isOpen={true}
            displayMode="embedded"
            onConfirm={completeInventoryAudit}
            onClose={() => {}}
          />
        </div>
      </div>
    );
  }

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
