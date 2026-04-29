"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useOpeningChecklist } from "@/contexts/opening-checklist-context";

export default function EmployeeInventoryScanPage() {
  const router = useRouter();
  const { isComplete } = useOpeningChecklist();

  useEffect(() => {
    if (isComplete) {
      router.replace("/employee/inventory/pawned-items");
    }
  }, [isComplete, router]);

  return null;
}