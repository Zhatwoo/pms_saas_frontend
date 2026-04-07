"use client";

import { useState } from "react";
import { PeriodTabs } from "@/components/shared/period-tabs";
import { AutoResetBanner } from "./_components/auto-reset-banner";
import { DashboardStats } from "./_components/dashboard-stats";
import { ContractTrendsChart } from "./_components/contract-trends-chart";
import { RevenueTrendChart } from "./_components/revenue-trend-chart";
import { NotificationsPanel } from "./_components/notifications-panel";
import { ItemsAttention } from "./_components/items-attention";

const periods = ["Daily", "Weekly", "Monthly", "Yearly"];

export default function DashboardPage() {
  const [activePeriod, setActivePeriod] = useState("Monthly");

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-500">
          Overview of performance, transactions, and inventory.
        </p>
        <PeriodTabs
          tabs={periods}
          activeTab={activePeriod}
          onTabChange={setActivePeriod}
        />
      </div>

      <AutoResetBanner />

      <DashboardStats />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <ContractTrendsChart />
        <RevenueTrendChart />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <NotificationsPanel />
        <ItemsAttention />
      </div>
    </div>
  );
}
