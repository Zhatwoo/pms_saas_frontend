"use client";

import { useState } from "react";
import { PeriodTabs } from "@/components/shared/period-tabs";
import { useBranch } from "@/contexts/branch-context";
import { AutoResetBanner } from "./_components/auto-reset-banner";
import { DashboardStats } from "./_components/dashboard-stats";
import { ContractTrendsChart } from "./_components/contract-trends-chart";
import { RevenueTrendChart } from "./_components/revenue-trend-chart";
import { NotificationsPanel } from "./_components/notifications-panel";
import { ItemsAttention } from "./_components/items-attention";
import { OverallSummaryStats } from "./_components/overall-summary-stats";

const periods = ["Daily", "Weekly", "Monthly", "Yearly"];

export default function DashboardPage() {
  const [activePeriod, setActivePeriod] = useState("Monthly");
  const { selectedBranch, isAllBranches } = useBranch();

  // Data ready to be fetched from API
  const overallData = {
    totalContracts: 0,
    active: 0,
    redeemed: 0,
    redeemedOverdue: 0,
    totalOverallSales: "₱ 0"
  };

  const kpiData = {
    activeContracts: 0,
    itemsNearExpiration: 0,
    itemsReadyForSale: 0,
    monthlyRevenue: "$ 0"
  };

  const contractTrendsData: any[] = [];
  const revenueTrendData: any[] = [];
  const notificationsData: any[] = [];
  const itemsAttentionData: any[] = [];

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-sm text-text-tertiary">
            Overview of performance, transactions, and inventory.
          </p>
          {/* Branch context indicator */}
          <p className="mt-0.5 text-xs text-text-muted">
            Showing data for:{" "}
            <span className="font-semibold text-emerald-text">
              {isAllBranches ? "All Branches" : selectedBranch.name}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-4">
          <PeriodTabs
            tabs={periods}
            activeTab={activePeriod}
            onTabChange={setActivePeriod}
          />
        </div>
      </div>

      <AutoResetBanner />

      <OverallSummaryStats data={overallData} />

      <DashboardStats data={kpiData} />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <ContractTrendsChart data={contractTrendsData} />
        <RevenueTrendChart data={revenueTrendData} />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <NotificationsPanel notifications={notificationsData} />
        <ItemsAttention items={itemsAttentionData} />
      </div>
    </div>
  );
}

