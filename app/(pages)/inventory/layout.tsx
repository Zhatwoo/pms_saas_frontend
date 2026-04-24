"use client";

import { usePathname } from "next/navigation";

export default function InventoryLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      {children}
    </div>
  );
}

