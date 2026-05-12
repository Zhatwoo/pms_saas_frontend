"use client";

import { usePathname } from "next/navigation";
import { useOpeningChecklist } from "@/contexts/opening-checklist-context";
import { InventoryAuditModal } from "@/components/shared/inventory-audit-modal";

export default function EmployeeInventoryLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPawned = pathname?.includes("pawned-items") ?? false;
  const { isComplete, currentStep, completeInventoryAudit } = useOpeningChecklist();



  return (
    <div className="pt-0 p-4">

      {!isComplete && currentStep === "INVENTORY_AUDIT" && (
        <InventoryAuditModal
          isOpen={true}
          displayMode="overlay"
          onConfirm={completeInventoryAudit}
          onClose={() => {}}
        />
      )}
      {/* Page Content */}
      <div className={!isComplete && currentStep === "INVENTORY_AUDIT" ? "pointer-events-none opacity-50 blur-sm" : ""}>
        {children}
      </div>
    </div>
  );
}
