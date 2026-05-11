"use client";

import { usePathname } from "next/navigation";
import { useOpeningChecklist } from "@/contexts/opening-checklist-context";
import { InventoryAuditModal } from "@/components/shared/inventory-audit-modal";

export default function EmployeeInventoryLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPawned = pathname?.includes("pawned-items") ?? false;
  const { isComplete, currentStep, completeInventoryAudit } = useOpeningChecklist();

  if (!isComplete && currentStep === "INVENTORY_AUDIT") {
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
    <div className="pt-0 p-4">

      {/* Page Content */}
      <div>
        {children}
      </div>
    </div>
  );
}
