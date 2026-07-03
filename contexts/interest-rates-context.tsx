"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useAuth } from "@/contexts/auth-context";
import { api } from "@/lib/api";
import {
  type InterestRateGroup,
  notifyInterestRatesUpdated,
  setInterestRatesCache,
  getInterestRateGroups,
} from "@/lib/interest";

interface InterestRatesContextValue {
  rates: InterestRateGroup[];
  isReady: boolean;
  refresh: () => Promise<InterestRateGroup[]>;
}

const InterestRatesContext = createContext<InterestRatesContextValue | null>(
  null,
);

export function InterestRatesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const [rates, setRates] = useState<InterestRateGroup[]>([]);
  const [isReady, setIsReady] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) {
      setInterestRatesCache([]);
      setRates([]);
      setIsReady(true);
      return [];
    }

    try {
      const data = await api.get<InterestRateGroup[]>("/settings/interest_rates");
      const next = Array.isArray(data) ? data : [];
      setInterestRatesCache(next);
      setRates(next);
      return next;
    } catch (error) {
      console.warn("Failed to load interest rates from database", error);
      return getInterestRateGroups();
    } finally {
      setIsReady(true);
    }
  }, [user]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      // Legacy cache — rates now come from shop_settings via API only.
      localStorage.removeItem("interest_rates");
    }
    setIsReady(false);
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const handleUpdated = () => {
      setIsReady(false);
      void refresh();
    };
    window.addEventListener("interest-rates-updated", handleUpdated);
    return () =>
      window.removeEventListener("interest-rates-updated", handleUpdated);
  }, [refresh]);

  const value = useMemo(
    () => ({ rates, isReady, refresh }),
    [rates, isReady, refresh],
  );

  return (
    <InterestRatesContext.Provider value={value}>
      {children}
    </InterestRatesContext.Provider>
  );
}

export function useInterestRates() {
  const context = useContext(InterestRatesContext);
  if (!context) {
    throw new Error("useInterestRates must be used within InterestRatesProvider");
  }
  return context;
}

/** Call after saving interest rates to DB so all screens reload from API. */
export function publishInterestRatesSaved(rates: InterestRateGroup[]) {
  setInterestRatesCache(rates);
  notifyInterestRatesUpdated();
}
