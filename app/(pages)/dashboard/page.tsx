"use client";

import { useState } from "react";
import { PeriodTabs } from "@/components/shared/period-tabs";
import { AutoResetBanner } from "./_components/auto-reset-banner";
import { DashboardStats } from "./_components/dashboard-stats";
import { ContractTrendsChart } from "./_components/contract-trends-chart";
import { RevenueTrendChart } from "./_components/revenue-trend-chart";
import { NotificationsPanel } from "./_components/notifications-panel";
import { ItemsAttention } from "./_components/items-attention";
import { OverallSummaryStats } from "./_components/overall-summary-stats";

const periods = ["Daily", "Weekly", "Monthly", "Yearly"];
const branches = ["All Branches", "Makati Main Branch", "Quezon City Branch", "Cebu Branch"];

export default function DashboardPage() {
  const [activePeriod, setActivePeriod] = useState("Monthly");
  const [selectedBranch, setSelectedBranch] = useState("All Branches");

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
        <p className="text-sm text-zinc-500">
          Overview of performance, transactions, and inventory.
        </p>
        <div className="flex items-center gap-4">
          <div className="bg-white border text-sm text-zinc-800 rounded-lg overflow-hidden flex items-center h-10 px-3 cursor-pointer">
             <select
               value={selectedBranch}
               onChange={(e) => setSelectedBranch(e.target.value)}
               className="bg-transparent border-none outline-none appearance-none pr-6 cursor-pointer font-medium"
             >
               {branches.map((b) => (
                 <option key={b} value={b}>{b}</option>
               ))}
             </select>
             <div className="pointer-events-none -ml-4">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
             </div>
          </div>
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
