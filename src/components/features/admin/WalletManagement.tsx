"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Trash2, Plus, Star } from "lucide-react";
import {
  SUPPORTED_CURRENCIES,
  CURRENCY_CONFIG,
  formatCurrencyWithSymbol,
} from "@/lib/utils/currency";
import { WalletService } from "@/lib/services/wallet";
import type { Wallet, Currency } from "@/types/database";

interface WalletManagementProps {
  userId: string;
  userEmail: string;
}

export function WalletManagement({ userId, userEmail }: WalletManagementProps) {
  const [wallets, setWallets] = useState<Array<Wallet & { balance: number }>>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [newWallet, setNewWallet] = useState({
    currency: "USD" as Currency,
    name: "",
  });

  const loadWallets = useCallback(async () => {
    try {
      setError("");
      const data = await WalletService.getUserWalletsWithBalances(userId);
      setWallets(data);
    } catch (error) {
      console.error("Error loading wallets:", error);
      setError("Failed to load wallets");
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadWallets();
  }, [loadWallets]);

  const handleCreateWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (wallets.length >= 5) {
      setError("User cannot have more than 5 wallets");
      return;
    }

    setIsCreating(true);
    setError("");
    try {
      await WalletService.createWallet({
        user_id: userId,
        currency: newWallet.currency,
        name: newWallet.name || `${newWallet.currency} Wallet`,
        is_default: wallets.length === 0,
      });

      setSuccess("Wallet created successfully");
      setNewWallet({ currency: "USD", name: "" });
      loadWallets();
    } catch (error) {
      console.error("Error creating wallet:", error);
      setError("Failed to create wallet: " + (error as Error).message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleSetDefault = async (walletId: string) => {
    try {
      setError("");
      await WalletService.setDefaultWallet(userId, walletId);
      setSuccess("Default wallet updated");
      loadWallets();
    } catch (error) {
      console.error("Error setting default wallet:", error);
      setError("Failed to update default wallet");
    }
  };

  const handleDeleteWallet = async (walletId: string) => {
    if (wallets.length === 1) {
      setError("Cannot delete the last wallet");
      return;
    }

    try {
      setError("");
      await WalletService.deleteWallet(walletId);
      setSuccess("Wallet deleted successfully");
      loadWallets();
    } catch (error) {
      console.error("Error deleting wallet:", error);
      setError("Failed to delete wallet");
    }
  };

  if (isLoading) {
    return <div>Loading wallets...</div>;
  }

  return (
    <div className="space-y-6">
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

      <Card>
        <CardHeader>
          <CardTitle>Manage Wallets for {userEmail}</CardTitle>
          <CardDescription>
            Create and manage currency wallets for this user (max 5 wallets)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Existing Wallets */}
            <div className="space-y-3">
              <h4 className="font-medium">
                Current Wallets ({wallets.length}/5)
              </h4>
              {wallets.map((wallet) => (
                <div
                  key={wallet.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{wallet.name}</span>
                        {wallet.is_default && (
                          <Badge variant="secondary" className="text-xs">
                            <Star className="w-3 h-3 mr-1" />
                            Default
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {CURRENCY_CONFIG[wallet.currency].symbol}{" "}
                        {wallet.currency} - Balance:{" "}
                        {formatCurrencyWithSymbol(
                          wallet.balance,
                          wallet.currency
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!wallet.is_default && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSetDefault(wallet.id)}
                      >
                        Set Default
                      </Button>
                    )}
                    {wallets.length > 1 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteWallet(wallet.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Create New Wallet */}
            {wallets.length < 5 && (
              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">Create New Wallet</h4>
                <form onSubmit={handleCreateWallet} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="currency">Currency</Label>
                      <Select
                        value={newWallet.currency}
                        onValueChange={(value: Currency) =>
                          setNewWallet({ ...newWallet, currency: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {SUPPORTED_CURRENCIES.filter(
                            (currency) =>
                              !wallets.some((w) => w.currency === currency)
                          ).map((currency) => (
                            <SelectItem key={currency} value={currency}>
                              {CURRENCY_CONFIG[currency].symbol} {currency} -{" "}
                              {CURRENCY_CONFIG[currency].name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="walletName">Wallet Name</Label>
                      <Input
                        id="walletName"
                        value={newWallet.name}
                        onChange={(e) =>
                          setNewWallet({ ...newWallet, name: e.target.value })
                        }
                        placeholder={`${newWallet.currency} Wallet`}
                      />
                    </div>
                  </div>
                  <Button
                    type="submit"
                    disabled={isCreating}
                    className="w-full"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    {isCreating ? "Creating..." : "Create Wallet"}
                  </Button>
                </form>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
