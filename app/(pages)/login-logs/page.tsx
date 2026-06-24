"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LoginLogsRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/audit-logs");
  }, [router]);
  return null;
}
