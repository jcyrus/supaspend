"use client";

import { useState, useEffect, useCallback } from "react";
import { DollarSign, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { WalletService } from "@/lib/services/wallet";
import { formatCurrencyWithSymbol } from "@/lib/utils/currency";
import type { UserWithBalance, Wallet } from "@/types/database";

interface FundUserModalProps {
  user: UserWithBalance | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function FundUserModal({
  user,
  open,
  onOpenChange,
  onSuccess,
}: FundUserModalProps) {
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [selectedWalletId, setSelectedWalletId] = useState("");
  const [wallets, setWallets] = useState<Array<Wallet & { balance: number }>>(
    []
  );
  const [loading, setLoading] = useState(false);
  const [walletsLoading, setWalletsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadUserWallets = useCallback(async () => {
    if (!user) return;

    setWalletsLoading(true);
    setError(""); // Clear any previous errors
    try {
      const userWallets = await WalletService.getUserWalletsWithBalances(
        user.user_id
      );
      setWallets(userWallets);

      // Auto-select default wallet or first wallet if no default
      const defaultWallet = userWallets.find((w) => w.is_default);
      const walletToSelect = defaultWallet || userWallets[0];

      if (walletToSelect) {
        setSelectedWalletId(walletToSelect.id);
      } else {
        setSelectedWalletId("");
      }
    } catch (error) {
      console.error("Error loading wallets:", error);
      setError(
        "Failed to load wallets. This user may not have any wallets yet."
      );
      setWallets([]);
      setSelectedWalletId("");
    } finally {
      setWalletsLoading(false);
    }
  }, [user]);

  const handleRefreshWallets = useCallback(async () => {
    if (!user) return;

    setRefreshing(true);
    try {
      await loadUserWallets();
    } finally {
      setRefreshing(false);
    }
  }, [user, loadUserWallets]);

  useEffect(() => {
    if (open && user) {
      loadUserWallets();
    }
  }, [open, user, loadUserWallets]);

  // Also refresh wallets when user.wallets changes (after wallet management)
  useEffect(() => {
    if (open && user && user.wallets) {
      loadUserWallets();
    }
  }, [open, user, user?.wallets, loadUserWallets]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedWalletId) return;

    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const selectedWallet = wallets.find((w) => w.id === selectedWalletId);
      if (!selectedWallet) {
        throw new Error("Selected wallet not found");
      }

      const response = await fetch("/api/admin/funds", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          wallet_id: selectedWalletId,
          amount: parseFloat(amount),
          description: description,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to add funds");
      }

      setSuccess(
        `Successfully added ${formatCurrencyWithSymbol(
          parseFloat(amount),
          selectedWallet.currency
        )} to ${user.username}'s ${selectedWallet.name}!`
      );
      setAmount("");
      setDescription("");
      loadUserWallets(); // Refresh wallet balances

      onSuccess();
    } catch (error) {
      console.error("Error adding funds:", error);
      setError(error instanceof Error ? error.message : "Failed to add funds");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setAmount("");
      setDescription("");
      setSelectedWalletId("");
      setError("");
      setSuccess("");
    }
    onOpenChange(newOpen);
  };

  const selectedWallet = wallets.find((w) => w.id === selectedWalletId);

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Funds to {user.username}</DialogTitle>
          <DialogDescription>
            Add funds to this user&apos;s petty cash balance.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {walletsLoading ? (
            <div className="p-4 text-center">Loading wallets...</div>
          ) : wallets.length === 0 ? (
            <div className="p-4 text-center space-y-3">
              <p className="text-muted-foreground">
                This user doesn&apos;t have any wallets yet.
              </p>
              <p className="text-sm text-muted-foreground">
                Create a wallet for them first using the &quot;Manage
                Wallets&quot; button in the user table.
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Available Wallets</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleRefreshWallets}
                    disabled={refreshing}
                    className="h-8 px-3"
                  >
                    <RefreshCw
                      className={`h-3 w-3 mr-1 ${
                        refreshing ? "animate-spin" : ""
                      }`}
                    />
                    Refresh
                  </Button>
                </div>
                {wallets.map((wallet) => (
                  <div key={wallet.id} className="p-3 bg-muted rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium">{wallet.name}</span>
                        {wallet.is_default && (
                          <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                            Default
                          </span>
                        )}
                        <div className="text-sm text-muted-foreground">
                          {wallet.currency}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">
                          {formatCurrencyWithSymbol(
                            wallet.balance,
                            wallet.currency
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {success && (
                  <Alert>
                    <AlertDescription>{success}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="wallet-select">Select Wallet</Label>
                  <Select
                    value={selectedWalletId}
                    onValueChange={setSelectedWalletId}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a wallet to fund" />
                    </SelectTrigger>
                    <SelectContent>
                      {wallets.map((wallet) => (
                        <SelectItem key={wallet.id} value={wallet.id}>
                          {wallet.name} ({wallet.currency}) -{" "}
                          {formatCurrencyWithSymbol(
                            wallet.balance,
                            wallet.currency
                          )}
                          {wallet.is_default && " (Default)"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fund-amount">
                    Amount{" "}
                    {selectedWallet ? `(${selectedWallet.currency})` : ""}
                  </Label>
                  <Input
                    id="fund-amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fund-description">
                    Description (optional)
                  </Label>
                  <Textarea
                    id="fund-description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    placeholder="Optional note for this deposit..."
                  />
                </div>

                <div className="flex justify-end space-x-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleOpenChange(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading || !selectedWalletId}>
                    <DollarSign className="h-4 w-4 mr-1" />
                    {loading ? "Adding..." : "Add Funds"}
                  </Button>
                </div>
              </form>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
