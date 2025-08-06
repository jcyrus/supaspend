"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser, getAdminUsers, checkUserRole } from "@/lib/auth-utils";
import type { UserWithBalance } from "@/types/database";

interface UseAdminUsersState {
  users: UserWithBalance[];
  loading: boolean;
  error: string | null;
}

export function useAdminUsers() {
  const router = useRouter();
  const [state, setState] = useState<UseAdminUsersState>({
    users: [],
    loading: true,
    error: null,
  });

  const fetchUsers = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      // Fetch users with balances
      const response = await fetch("/api/admin/users-with-balances");
      if (response.ok) {
        const responseData = await response.json();
        const { data, success } = responseData;
        const { users: usersWithBalanceData } = data || {};

        // Check if the response indicates success and has valid data
        if (success === false) {
          throw new Error(responseData.error || "API request failed");
        }

        // Ensure usersWithBalanceData is an array before processing
        if (Array.isArray(usersWithBalanceData)) {
          console.log(
            "Admin users with balances:",
            usersWithBalanceData.map((u) => ({
              username: u.username,
              balance: u.balance,
              user_id: u.user_id,
            }))
          );

          setState((prev) => ({
            ...prev,
            users: usersWithBalanceData,
            loading: false,
          }));
        } else {
          throw new Error("Invalid response format");
        }
      } else {
        throw new Error(`API request failed: ${response.status}`);
      }
    } catch (error) {
      console.error("Error fetching users:", error);

      try {
        // Fallback to old method if new endpoint fails
        const adminUsers = await getAdminUsers();

        if (!Array.isArray(adminUsers)) {
          throw new Error("getAdminUsers did not return an array");
        }

        // For fallback, we don't have balance information, so set empty balances
        const fallbackUsersWithBalances = adminUsers.map((user) => ({
          user_id: user.id,
          username: user.username,
          role: user.role,
          balance: 0,
          created_at: user.created_at,
          email: user.id, // Placeholder
        }));

        setState((prev) => ({
          ...prev,
          users: fallbackUsersWithBalances,
          loading: false,
        }));

        // Fetch email addresses for each user via API
        if (adminUsers.length > 0) {
          const userIds = adminUsers.map((user) => user.id).join(",");
          const emailResponse = await fetch(
            `/api/admin/users/emails?userIds=${userIds}`
          );

          if (emailResponse.ok) {
            const { emails } = await emailResponse.json();
            // Update users with actual emails
            const updatedUsers = fallbackUsersWithBalances.map((user) => ({
              ...user,
              email: emails[user.user_id] || "Loading...",
            }));
            setState((prev) => ({
              ...prev,
              users: updatedUsers,
            }));
          }
        }
      } catch (fallbackError) {
        console.error("Fallback method also failed:", fallbackError);
        setState((prev) => ({
          ...prev,
          error: "Failed to load users. Please refresh the page.",
          users: [],
          loading: false,
        }));
      }
    }
  }, []);

  const deleteUser = useCallback(
    async (userId: string) => {
      try {
        const response = await fetch(`/api/admin/users/${userId}`, {
          method: "DELETE",
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Failed to delete user");
        }

        await fetchUsers();
      } catch (error) {
        console.error("Error deleting user:", error);
        setState((prev) => ({
          ...prev,
          error: "Failed to delete user",
        }));
        throw error;
      }
    },
    [fetchUsers]
  );

  // Check access and fetch users on mount
  useEffect(() => {
    const checkAccess = async () => {
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        router.push("/auth/login");
        return;
      }

      const hasAccess = await checkUserRole("admin");
      if (!hasAccess) {
        router.push("/dashboard");
        return;
      }

      await fetchUsers();
    };

    checkAccess();
  }, [router, fetchUsers]);

  return {
    ...state,
    fetchUsers,
    deleteUser,
    refetch: fetchUsers,
  };
}
