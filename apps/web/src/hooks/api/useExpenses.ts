"use client";

import { useState, useCallback } from "react";
import { getCurrentUser } from "@/lib/auth-utils";
import type { Expense } from "@/types/database";

interface UseExpensesState {
  expenses: Expense[];
  loading: boolean;
  error: string | null;
}

interface UseExpensesFilters {
  dateFrom?: string;
  dateTo?: string;
  category?: string;
  minAmount?: string;
  maxAmount?: string;
  allUsers?: boolean;
}

export function useExpenses(initialFilters: UseExpensesFilters = {}) {
  const [state, setState] = useState<UseExpensesState>({
    expenses: [],
    loading: false,
    error: null,
  });

  const fetchExpenses = useCallback(
    async (filters: UseExpensesFilters = {}) => {
      try {
        setState((prev) => ({ ...prev, loading: true, error: null }));

        const currentUser = await getCurrentUser();
        if (!currentUser?.profile) {
          throw new Error("No user or user profile found");
        }

        // Build query parameters
        const params = new URLSearchParams();
        Object.entries({ ...initialFilters, ...filters }).forEach(
          ([key, value]) => {
            if (value && value !== "all") {
              params.append(key, value.toString());
            }
          }
        );

        const response = await fetch(
          `/api/transactions/expenses?${params.toString()}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch expenses");
        }

        const responseData = await response.json();
        const { expenses: expenseData } = responseData;

        setState((prev) => ({
          ...prev,
          expenses: expenseData || [],
          loading: false,
        }));

        return expenseData || [];
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to fetch expenses";
        setState((prev) => ({
          ...prev,
          error: errorMessage,
          loading: false,
          expenses: [],
        }));
        throw error;
      }
    },
    [initialFilters]
  );

  const updateExpense = useCallback(
    async (expenseId: string, data: Partial<Expense>) => {
      try {
        const response = await fetch(
          `/api/transactions/expenses/${expenseId}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          }
        );

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to update expense");
        }

        // Refresh expenses after update
        await fetchExpenses();
        return true;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to update expense";
        setState((prev) => ({ ...prev, error: errorMessage }));
        throw error;
      }
    },
    [fetchExpenses]
  );

  const deleteExpense = useCallback(
    async (expenseId: string) => {
      try {
        const response = await fetch(
          `/api/transactions/expenses/${expenseId}`,
          {
            method: "DELETE",
          }
        );

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to delete expense");
        }

        // Refresh expenses after delete
        await fetchExpenses();
        return true;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to delete expense";
        setState((prev) => ({ ...prev, error: errorMessage }));
        throw error;
      }
    },
    [fetchExpenses]
  );

  return {
    ...state,
    fetchExpenses,
    updateExpense,
    deleteExpense,
    refetch: fetchExpenses,
  };
}
