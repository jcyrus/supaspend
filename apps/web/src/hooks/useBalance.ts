"use client";

import { useState, useCallback, useEffect } from "react";

interface UseBalanceState {
  balance: number;
  loading: boolean;
  error: string | null;
}

export function useBalance() {
  const [state, setState] = useState<UseBalanceState>({
    balance: 0,
    loading: true,
    error: null,
  });

  const fetchBalance = useCallback(async (bustCache = false) => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      const balanceUrl = bustCache
        ? `/api/balance?t=${Date.now()}`
        : "/api/balance";
      const response = await fetch(balanceUrl, {
        method: "GET",
        headers: bustCache
          ? {
              "Cache-Control": "no-cache, no-store, must-revalidate",
              Pragma: "no-cache",
              Expires: "0",
            }
          : {},
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `HTTP ${response.status}: Failed to fetch balance`
        );
      }

      const balanceData = await response.json();

      // Extract the balance from the wrapped response
      const balance = Number(balanceData.data?.balance) || 0;

      setState((prev) => ({
        ...prev,
        balance,
        loading: false,
      }));

      return balance;
    } catch (error) {
      console.error("Error fetching balance:", error);
      setState((prev) => ({
        ...prev,
        error:
          error instanceof Error ? error.message : "Failed to fetch balance",
        loading: false,
      }));
      return 0;
    }
  }, []);

  const refreshBalance = useCallback(() => {
    return fetchBalance(true);
  }, [fetchBalance]);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  return {
    ...state,
    fetchBalance,
    refreshBalance,
    refetch: refreshBalance,
  };
}
