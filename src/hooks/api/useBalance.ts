"use client";

import { useState, useCallback } from "react";

interface UseBalanceState {
  balance: number;
  loading: boolean;
  error: string | null;
}

export function useBalance() {
  const [state, setState] = useState<UseBalanceState>({
    balance: 0,
    loading: false,
    error: null,
  });

  const fetchBalance = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      const response = await fetch("/api/balance");

      if (!response.ok) {
        throw new Error("Failed to fetch balance");
      }

      const { balance: userBalance } = await response.json();

      setState((prev) => ({
        ...prev,
        balance: userBalance || 0,
        loading: false,
      }));

      return userBalance || 0;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to fetch balance";
      setState((prev) => ({
        ...prev,
        error: errorMessage,
        loading: false,
        balance: 0,
      }));
      throw error;
    }
  }, []);

  return {
    ...state,
    fetchBalance,
    refetch: fetchBalance,
  };
}
