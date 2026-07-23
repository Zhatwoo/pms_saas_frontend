"use client";

import { useState, useEffect } from "react";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import { useBranch } from "@/contexts/branch-context";
import { AutoResetBanner } from "@/app/(pages)/dashboard/_components/auto-reset-banner";
import { DashboardStats } from "@/app/(pages)/dashboard/_components/dashboard-stats";
import { ContractTrendsChart } from "@/app/(pages)/dashboard/_components/contract-trends-chart";
import { RevenueTrendChart } from "@/app/(pages)/dashboard/_components/revenue-trend-chart";
import { NotificationsPanel } from "@/app/(pages)/dashboard/_components/notifications-panel";
import { ItemsAttention } from "@/app/(pages)/dashboard/_components/items-attention";
import { OverallSummaryStats } from "@/app/(pages)/dashboard/_components/overall-summary-stats";
import type { ContractTrendData } from "@/app/(pages)/dashboard/_components/contract-trends-chart";
import type { RevenueTrendData } from "@/app/(pages)/dashboard/_components/revenue-trend-chart";
import type { NotificationItem } from "@/app/(pages)/dashboard/_components/notifications-panel";
import type { AttentionItem } from "@/app/(pages)/dashboard/_components/items-attention";
import { useOpeningChecklist } from "@/contexts/opening-checklist-context";
import { LoadingSpinnerLabel } from "@/components/shared/loading-spinner-label";

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

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const { selectedBranch, isAllBranches } = useBranch();
  const { isComplete } = useOpeningChecklist();
  const [isLoading, setIsLoading] = useState(true);

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
    if (!isComplete) {
      setIsLoading(false);
      return;
    }

    async function fetchDashboardKpis() {
      setIsLoading(true);
      try {
        const query = isAllBranches ? "" : `?branch=${encodeURIComponent(selectedBranch.id)}`;
        const data = await api.get<PawnKpisResponse>(`/dashboard/pawn-kpis${query}`, {
          suppressApiIssueLogging: true,
        });
        if (data) {
          setOverallData(data.overallData);
          setKpiData(data.kpiData);
          setContractTrendsData(data.contractTrends || []);
          setRevenueTrendData(data.revenueTrend || []);
          setNotificationsData(data.notifications || []);
          setItemsAttentionData(data.attentionItems || []);
        }
      } catch (error) {
        if (
          error instanceof ApiError &&
          error.statusCode === 403 &&
          error.message.includes("opening checklist")
        ) {
          return;
        }
        console.error("Failed to load dashboard KPIs:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchDashboardKpis();
  }, [selectedBranch.id, isAllBranches, isComplete]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-brand-green dark:text-text-primary leading-tight">
          Welcome{user?.fullName ? `, ${user.fullName}` : ""}
        </h1>
        <p className="mt-1 text-sm text-text-tertiary">
          {isAllBranches
            ? "Overview of all branch performance, transactions, and inventory."
            : `Showing data for ${selectedBranch.name} — performance, transactions, and inventory.`}
        </p>
      </div>

      <AutoResetBanner />

      {isLoading ? (
        <div className="flex items-center justify-center rounded-xl border border-border-main bg-surface px-5 py-16 text-sm text-text-tertiary">
          <LoadingSpinnerLabel text="Updating data..." className="text-base font-medium text-text-tertiary" />
        </div>
      ) : (
        <div className="space-y-5">
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
      )}
    </div>
  );
}