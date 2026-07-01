"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { subscribeToInventoryTransferNotifications } from "@/lib/notification-stream";

export interface PendingItemTransferSummary {
  incomingCount: number;
  outgoingCount: number;
  totalPending: number;
  needsReceipt: boolean;
}

const EMPTY_SUMMARY: PendingItemTransferSummary = {
  incomingCount: 0,
  outgoingCount: 0,
  totalPending: 0,
  needsReceipt: false,
};

export function usePendingItemTransferSummary(branchId: string | null | undefined) {
  const [summary, setSummary] = useState<PendingItemTransferSummary>(EMPTY_SUMMARY);
  const [isLoading, setIsLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!branchId || branchId === "__all__") {
      setSummary(EMPTY_SUMMARY);
      return;
    }

    setIsLoading(true);
    try {
      const data = await api.get<PendingItemTransferSummary>(
        `/inventory/transfers/pending-summary?branch=${encodeURIComponent(branchId)}`,
      );
      setSummary({
        incomingCount: data.incomingCount ?? 0,
        outgoingCount: data.outgoingCount ?? 0,
        totalPending: data.totalPending ?? 0,
        needsReceipt: Boolean(data.needsReceipt),
      });
    } catch {
      setSummary(EMPTY_SUMMARY);
    } finally {
      setIsLoading(false);
    }
  }, [branchId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!branchId || branchId === "__all__") {
      return;
    }

    const unsubscribe = subscribeToInventoryTransferNotifications(() => {
      void refresh();
    });

    const handleCustomEvent = () => {
      void refresh();
    };

    window.addEventListener("pms:inventory-transfer-notification", handleCustomEvent);
    window.addEventListener("pms:inventory-transfer-updated", handleCustomEvent);

    const interval = window.setInterval(() => {
      void refresh();
    }, 60_000);

    return () => {
      unsubscribe();
      window.removeEventListener("pms:inventory-transfer-notification", handleCustomEvent);
      window.removeEventListener("pms:inventory-transfer-updated", handleCustomEvent);
      window.clearInterval(interval);
    };
  }, [branchId, refresh]);

  return { summary, isLoading, refresh };
}
