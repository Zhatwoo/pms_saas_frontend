"use client";

import { useState, useEffect } from "react";
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

export default function ExpirationMonitoringPage() {
  const [activeTab, setActiveTab] = useState("30days");
  const { selectedBranch, isAllBranches } = useBranch();
  const [isLoading, setIsLoading] = useState(true);

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

  const [toast, setToast] = useState<string | null>(null);
  const [isBlasting, setIsBlasting] = useState(false);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [renewingId, setRenewingId] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

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
      showToast(res?.message || "Email blast sent to customers.");
    } catch (error) {
      console.error(error);
      showToast(error instanceof Error ? error.message : "Failed to initiate email blast.");
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
      showToast(res?.message || `Email sent to ${customer}.`);
    } catch (error) {
      showToast(error instanceof Error ? error.message : `Failed to send email to ${customer}.`);
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
      setRenewingId(null);
    }
  };

  return (
    <div className="space-y-5 relative">
      {toast ? (
        <div className="pointer-events-none fixed inset-0 z-[70] flex items-center justify-center">
          <div className="rounded-xl border border-emerald-300 bg-emerald-100 px-5 py-3 text-sm font-semibold text-emerald-900 shadow-xl transition-all">
            {toast}
          </div>
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
          disabled={isBlasting || getActiveItems().length === 0}
          onClick={handleEmailBlast}
          className={`flex flex-none items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-bold shadow-sm transition-all ${
            isBlasting || getActiveItems().length === 0
              ? "bg-emerald-800/50 text-pawn-gold/50 cursor-not-allowed"
              : "bg-emerald-700 text-pawn-gold hover:bg-emerald-800"
          }`}
          title="Send mass email to all customers with nearing expirations"
        >
          {isBlasting ? (
            <svg className="h-4 w-4 animate-spin text-pawn-gold" viewBox="0 0 24 24" fill="none">
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
      />
    </div>
  );
}
