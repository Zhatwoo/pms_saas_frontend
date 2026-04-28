"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useBranch } from "@/contexts/branch-context";
import { PeriodTabs } from "@/components/shared/period-tabs";
import type { ContractTrendData } from "./_components/contract-trends-chart";
import type { RevenueTrendData } from "./_components/revenue-trend-chart";
import type { NotificationItem } from "./_components/notifications-panel";
import type { AttentionItem } from "./_components/items-attention";
import { AutoResetBanner } from "./_components/auto-reset-banner";
import { DashboardStats } from "./_components/dashboard-stats";
import { ContractTrendsChart } from "./_components/contract-trends-chart";
import { RevenueTrendChart } from "./_components/revenue-trend-chart";
import { NotificationsPanel } from "./_components/notifications-panel";
import { ItemsAttention } from "./_components/items-attention";
import { OverallSummaryStats } from "./_components/overall-summary-stats";

const periods = ["Daily", "Weekly", "Monthly", "Yearly"];

interface PawnKpisResponse {
  overallData: {
    totalContracts: number;
    active: number;
    redeemed: number;
    redeemedOverdue: number;
    totalOverallSales: string;
  };
  kpiData: {
    activeContracts: number;
    itemsNearExpiration: number;
    itemsReadyForSale: number;
    monthlyRevenue: string;
  };
  contractTrends: ContractTrendData[];
  revenueTrend: RevenueTrendData[];
  notifications: NotificationItem[];
  attentionItems: AttentionItem[];
}

export default function DashboardPage() {
  const [activePeriod, setActivePeriod] = useState("Monthly");
  const { selectedBranch, isAllBranches } = useBranch();
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoadedData, setHasLoadedData] = useState(false);

  const [overallData, setOverallData] = useState({
    totalContracts: 0,
    active: 0,
    redeemed: 0,
    redeemedOverdue: 0,
    totalOverallSales: "₱ 0",
  });

  const [kpiData, setKpiData] = useState({
    activeContracts: 0,
    itemsNearExpiration: 0,
    itemsReadyForSale: 0,
    monthlyRevenue: "₱ 0",
  });

  const [contractTrendsData, setContractTrendsData] = useState<ContractTrendData[]>([]);
  const [revenueTrendData, setRevenueTrendData] = useState<RevenueTrendData[]>([]);
  const [notificationsData, setNotificationsData] = useState<NotificationItem[]>([]);
  const [itemsAttentionData, setItemsAttentionData] = useState<AttentionItem[]>([]);

  useEffect(() => {
    async function fetchDashboardKpis() {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        if (!isAllBranches) params.set("branch", selectedBranch.id);
        params.set("period", activePeriod.toLowerCase());
        const data = await api.get<PawnKpisResponse>(`/dashboard/pawn-kpis?${params}`);
        if (data) {
          setOverallData(data.overallData);
          setKpiData(data.kpiData);
          setContractTrendsData(data.contractTrends || []);
          setRevenueTrendData(data.revenueTrend || []);
          setNotificationsData(data.notifications || []);
          setItemsAttentionData(data.attentionItems || []);
        }
      } catch (error) {
        console.error("Failed to load dashboard KPIs:", error);
      } finally {
        setIsLoading(false);
        setHasLoadedData(true);
      }
    }
    fetchDashboardKpis();
  }, [selectedBranch.id, isAllBranches, activePeriod]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-sm text-text-tertiary">
            Overview of performance, transactions, and inventory.
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

      {isLoading && !hasLoadedData ? (
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-3 text-text-tertiary">
            <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span className="text-sm font-medium">Loading dashboard data...</span>
          </div>
        </div>
      ) : (
        <>
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
        </>
      )}
    </div>
  );
}
