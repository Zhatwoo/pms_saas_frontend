"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { useBranch } from "@/contexts/branch-context";
import { DateFilterSelector } from "@/components/shared/date-filter-selector";
import { LoadingSpinnerLabel } from "@/components/shared/loading-spinner-label";
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
    branchSales?: number;
    allBranchSales?: number;
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
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const { selectedBranch, isAllBranches } = useBranch();
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoadedData, setHasLoadedData] = useState(false);

  const [overallData, setOverallData] = useState({
    totalContracts: 0,
    active: 0,
    redeemed: 0,
    redeemedOverdue: 0,
    totalOverallSales: "₱ 0",
    branchSales: 0,
    allBranchSales: 0,
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
        if (startDate && endDate) {
          params.set("startDate", startDate);
          params.set("endDate", endDate);
        }
        const data = await api.get<PawnKpisResponse>(`/dashboard/pawn-kpis?${params}`);
        if (data) {
          setOverallData({
            ...data.overallData,
            branchSales: data.overallData.branchSales || 0,
            allBranchSales: data.overallData.allBranchSales || 0,
          });
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
  }, [selectedBranch.id, isAllBranches, activePeriod, startDate, endDate]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 lg:max-w-md">
          <p className="text-sm leading-relaxed text-text-tertiary">
            Overview of performance, transactions, and inventory.
          </p>
        </div>
        <div className="flex items-center gap-4 lg:shrink-0">
          <DateFilterSelector
            periods={periods}
            activePeriod={activePeriod}
            onPeriodChange={setActivePeriod}
            onDateRangeChange={useCallback((start: string | null, end: string | null) => {
              setStartDate(start);
              setEndDate(end);
            }, [])}
          />
        </div>
      </div>

      <AutoResetBanner />

      {isLoading ? (
        <div className="flex items-center justify-center rounded-xl border border-border-main bg-surface px-5 py-16 text-sm text-text-tertiary">
          <LoadingSpinnerLabel text="Updating data..." className="text-base font-medium text-text-tertiary" />
        </div>
      ) : (
        <div className="space-y-5">
          <OverallSummaryStats data={overallData} />

          <DashboardStats data={kpiData} period={activePeriod} />

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <ContractTrendsChart data={contractTrendsData} />
            <RevenueTrendChart data={revenueTrendData} />
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <NotificationsPanel notifications={notificationsData} />
            <ItemsAttention items={itemsAttentionData} />
          </div>
        </div>
      )}
    </div>
  );
}
