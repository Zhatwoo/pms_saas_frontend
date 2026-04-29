"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { toast } from "sonner";
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
  const searchParams = useSearchParams();
  const highlightTicketNo = searchParams?.get("ticketNo");
  const highlightTransaction = searchParams?.get("highlightTransaction");

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

  const [isBlasting, setIsBlasting] = useState(false);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [renewingId, setRenewingId] = useState<string | null>(null);

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

  const handleEmailBlast = async () => {
    if (isBlasting) return;
    setIsBlasting(true);
    try {
      const query = isAllBranches ? "" : `?branch=${encodeURIComponent(selectedBranch.id)}`;
      const res = await api.post<{ message?: string }>(
        `/dashboard/expiration-monitoring/email-blast${query}`,
        { bucket: activeTab },
      );
      toast.success(res?.message || "Email blast sent to customers.");
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Failed to initiate email blast.");
    } finally {
      setIsBlasting(false);
    }
  };

  const handleSendEmail = async (id: string, customer: string) => {
    setSendingId(id);
    try {
      const query = isAllBranches ? "" : `?branch=${encodeURIComponent(selectedBranch.id)}`;
      const res = await api.post<{ message?: string }>(
        `/dashboard/expiration-monitoring/${id}/send-email${query}`,
        {},
      );
      toast.success(res?.message || `Email sent to ${customer}.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : `Failed to send email to ${customer}.`);
    } finally {
      setSendingId(null);
    }
  };

  const handleRenew = async (id: string) => {
    setRenewingId(id);
    try {
      const today = new Date().toISOString().split("T")[0];
      await api.post(`/inventory/pawned/${id}/renew`, {
        renewal_date: today,
        amount_paid: 0,
      });
      toast.success("Item renewed successfully.");
      const query = isAllBranches ? "" : `?branch=${encodeURIComponent(selectedBranch.id)}`;
      const data = await api.get<ExpirationMonitoringResponse>(
        `/dashboard/expiration-monitoring${query}`
      );
      if (data) {
        setStats(data.stats);
        setBuckets(data.buckets);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to renew item.");
    } finally {
      setRenewingId(null);
    }
  };

  return (
    <div className="space-y-5 relative">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="mt-1 text-sm text-zinc-500">
            Track contracts nearing expiration and overdue items
          </p>
        </div>
        <button
          type="button"
          disabled={isBlasting || getActiveItems().length === 0}
          onClick={handleEmailBlast}
          className={`flex flex-none items-center justify-center gap-2 rounded-lg border border-emerald-700 dark:border-emerald-400/80 px-5 py-2.5 text-sm font-bold shadow-sm transition-all ${
            isBlasting || getActiveItems().length === 0
              ? "bg-pawn-sidebar/50 text-amber-400/50 cursor-not-allowed"
              : "bg-pawn-sidebar text-amber-400 hover:opacity-90"
          }`}
          title="Send mass email to all customers with nearing expirations"
        >
          {isBlasting ? (
            <svg className="h-4 w-4 animate-spin text-amber-400" viewBox="0 0 24 24" fill="none">
               <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
               <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : sendIcon}
          {isBlasting ? "Sending Blast..." : "Instant Email Blast"}
        </button>
      </div>

      <ExpirationStats data={stats} isLoading={isLoading} />
      <ExpirationTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        counts={stats}
      />
      <ExpirationTable 
        data={getActiveItems()} 
        isLoading={isLoading} 
        sendingId={sendingId}
        renewingId={renewingId}
        onSendEmail={handleSendEmail}
        onRenew={handleRenew}
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
