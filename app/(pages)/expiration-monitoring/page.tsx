"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useBranch } from "@/contexts/branch-context";
import { useAuth } from "@/contexts/auth-context";
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
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoadedData, setHasLoadedData] = useState(false);
  const searchParams = useSearchParams();
  const highlightTicketNo = searchParams?.get("ticketNo");
  const highlightTransaction = searchParams?.get("highlightTransaction");
  const router = useRouter();
  const [isBlastSending, setIsBlastSending] = useState(false);
  const [sendingItemId, setSendingItemId] = useState<string | null>(null);
  const [renewingItemId, setRenewingItemId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const canRenew = user?.role === "admin" || user?.role === "employee";

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

  const handleRenew = (id: string, ticketNo: string) => {
    router.push(`/employee/pawn-transaction?action=renew&ticketNo=${encodeURIComponent(ticketNo)}`);
  };

  return (
    <div className="space-y-5">
      {toast ? (
        <div className="fixed right-4 top-4 z-50 rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white shadow-md">
          {toast}
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
          className="flex h-11 flex-none items-center justify-center gap-2 rounded-lg border border-emerald-700 dark:border-emerald-400/80 bg-pawn-sidebar px-5 py-2.5 text-sm font-bold text-amber-400 shadow-sm transition-all hover:opacity-90"
          title="Send mass email to all customers with nearing expirations"
        >
          <span className="text-amber-400">{sendIcon}</span>
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
        canRenew={canRenew}
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
