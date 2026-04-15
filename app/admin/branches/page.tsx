"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminBranchesRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin/branch-overview");
  }, [router]);

  return (
    <div className="rounded-lg border border-border-main bg-surface px-4 py-8 text-center text-sm text-text-secondary">
      Redirecting to Branch Overview...
    </div>
  );
}
