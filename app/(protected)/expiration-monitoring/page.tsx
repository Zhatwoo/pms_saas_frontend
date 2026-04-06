"use client";

import { useState } from "react";
import { ExpirationStats } from "@/components/expiration/expiration-stats";
import { ExpirationTabs } from "@/components/expiration/expiration-tabs";
import { ExpirationTable } from "@/components/expiration/expiration-table";

export default function ExpirationMonitoringPage() {
  const [activeTab, setActiveTab] = useState("30days");

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-medium text-zinc-400">Taguig Branch</p>
        <p className="mt-1 text-sm text-zinc-500">
          Track contracts nearing expiration and overdue items
        </p>
      </div>

      <ExpirationStats />
      <ExpirationTabs activeTab={activeTab} onTabChange={setActiveTab} />
      <ExpirationTable />
    </div>
  );
}
