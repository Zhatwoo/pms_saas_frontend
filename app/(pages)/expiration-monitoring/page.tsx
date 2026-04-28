"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { useBranch } from "@/contexts/branch-context";
import { ExpirationStats } from "./_components/expiration-stats";
import { ExpirationTabs } from "./_components/expiration-tabs";
import { ExpirationTable } from "./_components/expiration-table";

const sendIcon = (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

interface ExpirationItem {
  id: string;
  ticketNo: string;
  customer: string;
  customerEmail?: string | null;
  item: string;
  principal: number;
  totalDue: number;
  maturityDate: string;
  daysRemaining: number;
}

interface ExpirationMonitoringResponse {
  stats: {
    overdue: number;
    threeDays: number;
    sevenDays: number;
    thirtyDays: number;
  };
  items: ExpirationItem[];
  buckets: {
    overdue: ExpirationItem[];
    threeDays: ExpirationItem[];
    sevenDays: ExpirationItem[];
    thirtyDays: ExpirationItem[];
  };
}

function ExpirationMonitoringPageContent() {
  const [activeTab, setActiveTab] = useState("30days");
  const { selectedBranch, isAllBranches } = useBranch();
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoadedData, setHasLoadedData] = useState(false);
  const searchParams = useSearchParams();
  const highlightTicketNo = searchParams?.get("ticketNo");
  const highlightTransaction = searchParams?.get("highlightTransaction");
  const [isBlastSending, setIsBlastSending] = useState(false);
  const [sendingItemId, setSendingItemId] = useState<string | null>(null);
  const [renewingItemId, setRenewingItemId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const [stats, setStats] = useState({
    overdue: 0,
    threeDays: 0,
    sevenDays: 0,
    thirtyDays: 0,
  });

  const [buckets, setBuckets] = useState<{
    overdue: ExpirationItem[];
    threeDays: ExpirationItem[];
    sevenDays: ExpirationItem[];
    thirtyDays: ExpirationItem[];
  }>({
    overdue: [],
    threeDays: [],
    sevenDays: [],
    thirtyDays: [],
  });

  useEffect(() => {
    async function fetchExpirationData() {
      setIsLoading(true);
      try {
        const query = isAllBranches ? "" : `?branch=${encodeURIComponent(selectedBranch.id)}`;
        const data = await api.get<ExpirationMonitoringResponse>(
          `/dashboard/expiration-monitoring${query}`
        );
        if (data) {
          setStats(data.stats);
          setBuckets(data.buckets);
        }
      } catch (error) {
        console.error("Failed to load expiration monitoring data:", error);
      } finally {
        setIsLoading(false);
        setHasLoadedData(true);
      }
    }
    fetchExpirationData();
  }, [selectedBranch.id, isAllBranches]);

  useEffect(() => {
    if (highlightTicketNo && highlightTransaction === "true" && buckets) {
      if (buckets.overdue.some((item) => item.ticketNo === highlightTicketNo)) {
        setActiveTab("overdue");
      } else if (buckets.threeDays.some((item) => item.ticketNo === highlightTicketNo)) {
        setActiveTab("3days");
      } else if (buckets.sevenDays.some((item) => item.ticketNo === highlightTicketNo)) {
        setActiveTab("7days");
      } else if (buckets.thirtyDays.some((item) => item.ticketNo === highlightTicketNo)) {
        setActiveTab("30days");
      }
    }
  }, [highlightTicketNo, highlightTransaction, buckets]);

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2500);
  };

  // Determine which bucket to show based on active tab
  const getActiveItems = (): ExpirationItem[] => {
    switch (activeTab) {
      case "overdue":
        return buckets.overdue;
      case "3days":
        return buckets.threeDays;
      case "7days":
        return buckets.sevenDays;
      case "30days":
        return buckets.thirtyDays;
      default:
        return buckets.thirtyDays;
    }
  };

  const handleBlastEmail = async () => {
    setIsBlastSending(true);
    try {
      const query = isAllBranches ? "" : `?branch=${encodeURIComponent(selectedBranch.id)}`;
      const result = await api.post<{ message?: string; sentCount?: number }>(
        `/dashboard/expiration-monitoring/email-blast${query}`,
        { bucket: activeTab },
      );
      showToast(
        result?.message ||
          `Email blast sent${result?.sentCount ? ` (${result.sentCount})` : ""}.`,
      );
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Failed to send email blast.");
    } finally {
      setIsBlastSending(false);
    }
  };

  const handleSendSingleEmail = async (id: string) => {
    setSendingItemId(id);
    try {
      const query = isAllBranches ? "" : `?branch=${encodeURIComponent(selectedBranch.id)}`;
      const result = await api.post<{ message?: string }>(
        `/dashboard/expiration-monitoring/${id}/send-email${query}`,
        {},
      );
      showToast(result?.message || "Email sent successfully.");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Failed to send email.");
    } finally {
      setSendingItemId(null);
    }
  };

  const handleRenew = async (id: string) => {
    setRenewingItemId(id);
    try {
      const today = new Date().toISOString().split("T")[0];
      await api.post(`/inventory/pawned/${id}/renew`, {
        renewal_date: today,
        amount_paid: 0,
      });
      showToast("Item renewed successfully.");
      const query = isAllBranches ? "" : `?branch=${encodeURIComponent(selectedBranch.id)}`;
      const data = await api.get<ExpirationMonitoringResponse>(
        `/dashboard/expiration-monitoring${query}`
      );
      if (data) {
        setStats(data.stats);
        setBuckets(data.buckets);
      }
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Failed to renew item.");
    } finally {
      setRenewingItemId(null);
    }
  };

  return (
    <div className="space-y-5">
      {toast ? (
        <div className="fixed right-4 top-4 z-50 rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white shadow-md">
          {toast}
        </div>
      ) : null}
      {isLoading && hasLoadedData ? (
        <div className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
          <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span>Refreshing expiration data...</span>
        </div>
      ) : null}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="mt-1 text-sm text-zinc-500">
            Track contracts nearing expiration and overdue items
          </p>
        </div>
        <button
          type="button"
          onClick={handleBlastEmail}
          disabled={isBlastSending}
          className="flex flex-none items-center justify-center gap-2 rounded-lg bg-emerald-700 px-5 py-2.5 text-sm font-bold text-pawn-gold shadow-sm transition-all hover:bg-emerald-800"
          title="Send mass email to all customers with nearing expirations"
        >
          {sendIcon}
          {isBlastSending ? "Sending..." : "Instant Email Blast"}
        </button>
      </div>

      <ExpirationStats data={stats} isLoading={isLoading && !hasLoadedData} />
      <ExpirationTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        counts={stats}
      />
      <ExpirationTable
        data={getActiveItems()}
        isLoading={isLoading && !hasLoadedData}
        onSendEmail={handleSendSingleEmail}
        sendingItemId={sendingItemId}
        onRenew={handleRenew}
        renewingItemId={renewingItemId}
        highlightTicketNo={highlightTicketNo}
      />
    </div>
  );
}

export default function ExpirationMonitoringPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-zinc-500">Loading...</div>}>
      <ExpirationMonitoringPageContent />
    </Suspense>
  );
}
