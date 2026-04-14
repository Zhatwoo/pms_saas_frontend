"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * /branches now acts as a parent route for the Branch Management dropdown.
 * Redirect to /branch-overview which has the full branch CRUD UI.
 */
export default function BranchesRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/branch-overview");
  }, [router]);

  return (
    <div className="rounded-lg border border-border-main bg-surface px-4 py-8 text-center text-sm text-text-secondary">
      Redirecting to Branch Overview...
    </div>
  );
}
