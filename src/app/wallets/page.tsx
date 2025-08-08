"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Wallet,
  Plus,
  Edit,
  Trash2,
  Star,
  CreditCard,
  DollarSign,
} from "lucide-react";
import { getCurrentUser, checkUserRole } from "@/lib/auth-utils";
import { useWallets, useWalletBalances } from "@/hooks/api/useWallets";
import { WalletService } from "@/lib/services/wallet";
import {
  formatCurrencyWithSymbol,
  getBalanceColor,
} from "@/lib/utils/currency";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import type { Currency, User, Wallet as WalletType } from "@/types/database";
import { toast } from "sonner";

// Type for the user returned by getCurrentUser
type UserWithProfile = {
  id: string;
  email?: string;
  profile: User;
} | null;

const CURRENCIES: Currency[] = ["USD", "VND", "IDR", "PHP"];

export default function WalletsPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<UserWithProfile>(null);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingWallet, setEditingWallet] = useState<WalletType | null>(null);
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [selectedTopUpWallet, setSelectedTopUpWallet] =
    useState<WalletType | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    currency: "USD" as Currency,
  });
  const [topUpData, setTopUpData] = useState({
    amount: "",
    description: "",
  });
  const [confirmDelete, setConfirmDelete] = useState<{
    isOpen: boolean;
    walletId: string | null;
    walletName: string;
  }>({
    isOpen: false,
    walletId: null,
    walletName: "",
  });
  const [confirmTopUp, setConfirmTopUp] = useState<{
    isOpen: boolean;
    amount: string;
    walletName: string;
  }>({
    isOpen: false,
    amount: "",
    walletName: "",
  });

  const {
    wallets,
    loading: walletsLoading,
    refetch,
  } = useWallets(currentUser?.id);
  const { balances, loading: balancesLoading } = useWalletBalances(wallets);

  useEffect(() => {
    const initializeUser = async () => {
      try {
        const user = await getCurrentUser();
        if (!user) {
          router.push("/auth/login");
          return;
        }
        setCurrentUser(user);

        // Check if user is admin
        const hasAdminAccess = await checkUserRole("admin");
        setIsAdmin(hasAdminAccess);
      } catch (error) {
        console.error("Error getting current user:", error);
        router.push("/auth/login");
      } finally {
        setLoading(false);
      }
    };

    initializeUser();
  }, [router]);

  const handleCreateWallet = async () => {
    if (!currentUser || !formData.name.trim()) return;

    try {
      await WalletService.createWallet({
        user_id: currentUser.id,
        name: formData.name.trim(),
        currency: formData.currency,
        is_default: wallets.length === 0, // First wallet is default
      });

      setFormData({ name: "", currency: "USD" });
      setIsCreateOpen(false);
      refetch();
      toast.success("Wallet created successfully!");
    } catch (error) {
      console.error("Error creating wallet:", error);
      toast.error("Failed to create wallet. Please try again.");
    }
  };

  const handleEditWallet = async () => {
    if (!editingWallet || !formData.name.trim()) return;

    try {
      await WalletService.updateWallet(editingWallet.id, {
        name: formData.name.trim(),
        currency: formData.currency,
      });

      setEditingWallet(null);
      setFormData({ name: "", currency: "USD" });
      refetch();
      toast.success("Wallet updated successfully!");
    } catch (error) {
      console.error("Error updating wallet:", error);
      toast.error("Failed to update wallet. Please try again.");
    }
  };

  const handleDeleteWallet = async (walletId: string) => {
    const wallet = wallets.find((w) => w.id === walletId);
    if (!wallet) return;

    setConfirmDelete({
      isOpen: true,
      walletId: walletId,
      walletName: wallet.name,
    });
  };

  const confirmDeleteWallet = async () => {
    if (!confirmDelete.walletId) return;

    try {
      await WalletService.deleteWallet(confirmDelete.walletId);
      refetch();
      toast.success("Wallet deleted successfully!");
    } catch (error) {
      console.error("Error deleting wallet:", error);
      toast.error("Failed to delete wallet. Please try again.");
    } finally {
      setConfirmDelete({ isOpen: false, walletId: null, walletName: "" });
    }
  };

  const handleSetDefault = async (walletId: string) => {
    if (!currentUser) return;
    try {
      await WalletService.setDefaultWallet(currentUser.id, walletId);
      refetch();
      toast.success("Default wallet updated!");
    } catch (error) {
      console.error("Error setting default wallet:", error);
      toast.error("Failed to set default wallet. Please try again.");
    }
  };

  const handleSelfTopUp = async () => {
    if (!selectedTopUpWallet || !topUpData.amount || !currentUser) return;

    const amount = parseFloat(topUpData.amount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    // Show confirmation dialog
    setConfirmTopUp({
      isOpen: true,
      amount: formatCurrencyWithSymbol(amount, selectedTopUpWallet.currency),
      walletName: selectedTopUpWallet.name,
    });
  };

  const confirmSelfTopUp = async () => {
    if (!selectedTopUpWallet || !topUpData.amount || !currentUser) return;

    const amount = parseFloat(topUpData.amount);

    try {
      const response = await fetch("/api/admin/funds", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recipient_id: currentUser.id,
          wallet_id: selectedTopUpWallet.id,
          amount: amount,
          description:
            topUpData.description ||
            `Self top-up to ${selectedTopUpWallet.name}`,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to process top-up");
      }

      // Reset form and close modal
      setTopUpData({ amount: "", description: "" });
      setSelectedTopUpWallet(null);
      setIsTopUpOpen(false);
      setConfirmTopUp({ isOpen: false, amount: "", walletName: "" });

      // Refresh wallet balances
      refetch();

      toast.success("Top-up successful!");
    } catch (error) {
      console.error("Error processing top-up:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to process top-up"
      );
      setConfirmTopUp({ isOpen: false, amount: "", walletName: "" });
    }
  };

  const openEditModal = (wallet: WalletType) => {
    setEditingWallet(wallet);
    setFormData({
      name: wallet.name,
      currency: wallet.currency,
    });
  };

  const openTopUpModal = (wallet: WalletType) => {
    setSelectedTopUpWallet(wallet);
    setTopUpData({ amount: "", description: "" });
    setIsTopUpOpen(true);
  };

  if (loading || walletsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-6 px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            My Wallets
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
            Manage your wallets and currencies
          </p>
        </div>

        <div className="flex items-center space-x-3">
          {/* Self Top-up Button (Admin only) */}
          {isAdmin && (
            <Button
              variant="outline"
              onClick={() => setIsTopUpOpen(true)}
              disabled={wallets.length === 0}
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Top Up
            </Button>
          )}

          {/* Create Wallet Button */}
          {wallets.length < 5 && (
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Wallet
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Wallet</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="walletName">Wallet Name</Label>
                    <Input
                      id="walletName"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="Enter wallet name"
                    />
                  </div>
                  <div>
                    <Label>Currency</Label>
                    <Select
                      value={formData.currency}
                      onValueChange={(value: Currency) =>
                        setFormData({ ...formData, currency: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CURRENCIES.map((currency) => (
                          <SelectItem key={currency} value={currency}>
                            {currency}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => setIsCreateOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCreateWallet}
                      disabled={!formData.name.trim()}
                    >
                      Create Wallet
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Wallet Limit Info */}
      {wallets.length >= 5 && (
        <Card className="mb-6 border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950">
          <CardContent className="p-4">
            <div className="flex items-center">
              <Wallet className="h-5 w-5 text-orange-600 mr-2" />
              <p className="text-sm text-orange-800 dark:text-orange-200">
                You have reached the maximum limit of 5 wallets. Delete a wallet
                to create a new one.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Wallets Grid */}
      {wallets.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Wallet className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              No wallets yet
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
              Create your first wallet to start managing your expenses across
              different currencies.
            </p>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Wallet
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {wallets.map((wallet) => (
            <Card
              key={wallet.id}
              className={`${wallet.is_default ? "ring-2 ring-primary" : ""}`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <CardTitle className="text-lg">{wallet.name}</CardTitle>
                    {wallet.is_default && (
                      <Badge variant="secondary" className="text-xs">
                        Default
                      </Badge>
                    )}
                  </div>
                  <Badge variant="outline">{wallet.currency}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Balance */}
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      Balance
                    </p>
                    <div
                      className={`text-2xl font-semibold ${getBalanceColor(
                        balances[wallet.id] || 0
                      )}`}
                    >
                      {balancesLoading ? (
                        <div className="animate-pulse h-8 bg-muted rounded w-24"></div>
                      ) : (
                        formatCurrencyWithSymbol(
                          balances[wallet.id] || 0,
                          wallet.currency
                        )
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2">
                    {/* Top Up Button (Admin only) */}
                    {isAdmin && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openTopUpModal(wallet)}
                        className="flex-1 min-w-0"
                      >
                        <CreditCard className="h-4 w-4 mr-1" />
                        Top Up
                      </Button>
                    )}

                    {/* Set Default Button */}
                    {!wallet.is_default && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSetDefault(wallet.id)}
                        className="flex-1 min-w-0"
                      >
                        <Star className="h-4 w-4 mr-1" />
                        Set Default
                      </Button>
                    )}

                    {/* Edit Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditModal(wallet)}
                      className="px-3"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>

                    {/* Delete Button (not for default wallet) */}
                    {!wallet.is_default && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteWallet(wallet.id)}
                        className="text-destructive hover:text-destructive px-3"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Wallet Dialog */}
      <Dialog
        open={!!editingWallet}
        onOpenChange={(open) => !open && setEditingWallet(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Wallet</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="editWalletName">Wallet Name</Label>
              <Input
                id="editWalletName"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Enter wallet name"
              />
            </div>
            <div>
              <Label>Currency</Label>
              <Select
                value={formData.currency}
                onValueChange={(value: Currency) =>
                  setFormData({ ...formData, currency: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((currency) => (
                    <SelectItem key={currency} value={currency}>
                      {currency}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setEditingWallet(null)}>
                Cancel
              </Button>
              <Button
                onClick={handleEditWallet}
                disabled={!formData.name.trim()}
              >
                Update Wallet
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Self Top-up Dialog */}
      <Dialog open={isTopUpOpen} onOpenChange={setIsTopUpOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Top Up Wallet</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Wallet Selection */}
            <div>
              <Label>Select Wallet</Label>
              <Select
                value={selectedTopUpWallet?.id || ""}
                onValueChange={(walletId) => {
                  const wallet = wallets.find((w) => w.id === walletId);
                  setSelectedTopUpWallet(wallet || null);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a wallet to top up" />
                </SelectTrigger>
                <SelectContent>
                  {wallets.map((wallet) => (
                    <SelectItem key={wallet.id} value={wallet.id}>
                      <div className="flex items-center space-x-2">
                        <span>{wallet.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {wallet.currency}
                        </Badge>
                        {wallet.is_default && (
                          <Badge variant="secondary" className="text-xs">
                            Default
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Current Balance Display */}
            {selectedTopUpWallet && (
              <div className="p-3 bg-muted rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Current Balance:
                  </span>
                  <span
                    className={`text-lg font-semibold ${getBalanceColor(
                      balances[selectedTopUpWallet.id] || 0
                    )}`}
                  >
                    {formatCurrencyWithSymbol(
                      balances[selectedTopUpWallet.id] || 0,
                      selectedTopUpWallet.currency
                    )}
                  </span>
                </div>
              </div>
            )}

            {/* Amount Input */}
            <div>
              <Label htmlFor="topUpAmount">
                Amount{" "}
                {selectedTopUpWallet ? `(${selectedTopUpWallet.currency})` : ""}
              </Label>
              <Input
                id="topUpAmount"
                type="number"
                step="0.01"
                min="0.01"
                value={topUpData.amount}
                onChange={(e) =>
                  setTopUpData({ ...topUpData, amount: e.target.value })
                }
                placeholder="Enter amount to add"
              />
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="topUpDescription">Description (Optional)</Label>
              <Textarea
                id="topUpDescription"
                value={topUpData.description}
                onChange={(e) =>
                  setTopUpData({ ...topUpData, description: e.target.value })
                }
                placeholder="Enter a description for this top-up..."
                rows={3}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsTopUpOpen(false);
                  setSelectedTopUpWallet(null);
                  setTopUpData({ amount: "", description: "" });
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSelfTopUp}
                disabled={
                  !selectedTopUpWallet ||
                  !topUpData.amount ||
                  parseFloat(topUpData.amount) <= 0
                }
              >
                <DollarSign className="h-4 w-4 mr-2" />
                Top Up Wallet
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={confirmDelete.isOpen}
        onOpenChange={(open) =>
          !open &&
          setConfirmDelete({ isOpen: false, walletId: null, walletName: "" })
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Wallet</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &ldquo;{confirmDelete.walletName}
              &rdquo;? This action cannot be undone and will permanently remove
              this wallet and all its transaction history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteWallet}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Wallet
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Top-up Confirmation Dialog */}
      <AlertDialog
        open={confirmTopUp.isOpen}
        onOpenChange={(open) =>
          !open &&
          setConfirmTopUp({ isOpen: false, amount: "", walletName: "" })
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Top-up</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to add {confirmTopUp.amount} to &ldquo;
              {confirmTopUp.walletName}&rdquo;?
              {topUpData.description && (
                <>
                  <br />
                  <br />
                  <strong>Description:</strong> {topUpData.description}
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmSelfTopUp}>
              Confirm Top-up
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
