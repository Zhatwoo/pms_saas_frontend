"use client";

import { useState } from "react";
import { ExpirationStats } from "./_components/expiration-stats";
import { ExpirationTabs } from "./_components/expiration-tabs";
import { ExpirationTable } from "./_components/expiration-table";

export default function ExpirationMonitoringPage() {
  const [activeTab, setActiveTab] = useState("30days");

  return (
    <div className="space-y-5">
      <div>
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
