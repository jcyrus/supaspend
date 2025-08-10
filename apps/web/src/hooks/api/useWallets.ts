"use client";

import { useState, useEffect, useCallback } from "react";
import type { Wallet } from "@/types/database";
import { WalletService } from "@/lib/services/wallet";

export function useWallets(userId?: string) {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadWallets = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const userWallets = await WalletService.getUserWallets(userId);
      setWallets(userWallets);
    } catch (err) {
      console.error("Error loading wallets:", err);
      setError(err instanceof Error ? err.message : "Failed to load wallets");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadWallets();
  }, [loadWallets]);

  const refetch = () => {
    loadWallets();
  };

  return {
    wallets,
    loading,
    error,
    refetch,
  };
}

export function useWalletBalances(wallets: Wallet[]) {
  const [balances, setBalances] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadBalances = async () => {
      if (wallets.length === 0) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const balancePromises = wallets.map(async (wallet) => {
          const balance = await WalletService.getWalletBalance(wallet.id);
          return { walletId: wallet.id, balance };
        });

        const results = await Promise.all(balancePromises);
        const balanceMap: Record<string, number> = {};
        results.forEach(({ walletId, balance }) => {
          balanceMap[walletId] = balance;
        });

        setBalances(balanceMap);
      } catch (error) {
        console.error("Error loading wallet balances:", error);
      } finally {
        setLoading(false);
      }
    };

    loadBalances();
  }, [wallets]);

  return { balances, loading };
}
