"use client";

import { useState, useCallback, useEffect } from "react";
import { getCurrentUser } from "@/lib/auth-utils";

interface UseCurrentAdminState {
  currentAdmin: {
    user_id: string;
    username: string;
    email: string;
    balance: number;
    role: string;
  } | null;
  loading: boolean;
  error: string | null;
}

export function useCurrentAdmin() {
  const [state, setState] = useState<UseCurrentAdminState>({
    currentAdmin: null,
    loading: true,
    error: null,
  });

  const fetchCurrentAdmin = useCallback(async (bustCache = false) => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      const currentUser = await getCurrentUser();
      if (!currentUser?.profile) {
        throw new Error("No user or user profile found");
      }

      console.log("Fetching balance for admin:", currentUser.id);

      // Get admin's balance with cache busting
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
        throw new Error("Failed to fetch admin balance");
      }

      const balanceData = await response.json();
      console.log("Balance API response:", balanceData);

      const adminData = {
        user_id: currentUser.id,
        username: currentUser.profile.username,
        email: currentUser.email || "",
        balance: Number(balanceData.data?.balance) || 0,
        role: currentUser.profile.role,
      };

      console.log("Setting admin data:", adminData);

      setState((prev) => ({
        ...prev,
        currentAdmin: adminData,
        loading: false,
      }));
    } catch (error) {
      console.error("Error fetching current admin:", error);
      setState((prev) => ({
        ...prev,
        error:
          error instanceof Error ? error.message : "Failed to fetch admin info",
        loading: false,
      }));
    }
  }, []);

  const fundSelf = useCallback(
    async (amount: number, description?: string) => {
      if (!state.currentAdmin) {
        throw new Error("No current admin found");
      }

      const requestData = {
        recipient_id: state.currentAdmin.user_id,
        amount: Number(amount),
        description: description || "Admin self top-up",
      };

      console.log("Funding self with:", requestData);

      try {
        const response = await fetch("/api/admin/funds", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestData),
        });

        const result = await response.json();
        console.log("Fund self API response:", {
          status: response.status,
          ok: response.ok,
          result: result,
        });

        if (!response.ok) {
          console.error("Fund self API error:", result);
          throw new Error(
            result.error || `HTTP ${response.status}: Failed to add funds`
          );
        }

        // Check if the database function returned an error message
        if (result.message && result.message.startsWith("Error:")) {
          console.error("Database function error:", result.message);
          throw new Error(result.message);
        }

        console.log("Fund self successful, waiting before balance refresh...");

        // Wait a moment for database to process the transaction
        await new Promise((resolve) => setTimeout(resolve, 1500));

        // Refresh admin info with cache busting after successful funding
        console.log("Refreshing admin balance after funding...");
        await fetchCurrentAdmin(true);

        console.log("Balance refresh completed");
        return result;
      } catch (error) {
        console.error("Error funding self:", error);
        throw error;
      }
    },
    [state.currentAdmin, fetchCurrentAdmin]
  );

  useEffect(() => {
    fetchCurrentAdmin();
  }, [fetchCurrentAdmin]);

  return {
    ...state,
    fetchCurrentAdmin,
    fundSelf,
    refetch: () => fetchCurrentAdmin(true),
  };
}
