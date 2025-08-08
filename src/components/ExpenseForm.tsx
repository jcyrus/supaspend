"use client";

import { createClient } from "@/lib/supabase/client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Save, ArrowLeft, Wallet, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { EXPENSE_CATEGORIES } from "@/types/database";
import type { ExpenseInsert } from "@/types/database";
import {
  getBalanceColor,
  formatCurrencyWithSymbol,
} from "@/lib/utils/currency";
import { WalletService } from "@/lib/services/wallet";
import type { Wallet as WalletType } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

export default function ExpenseForm() {
  const supabase = createClient();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [wallets, setWallets] = useState<
    Array<WalletType & { balance: number }>
  >([]);
  const [selectedWalletId, setSelectedWalletId] = useState("");
  const [walletsLoading, setWalletsLoading] = useState(true);
  const [formData, setFormData] = useState({
    date: format(new Date(), "yyyy-MM-dd"),
    amount: "",
    category: "",
    description: "",
  });

  const loadUserWallets = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const userWallets = await WalletService.getUserWalletsWithBalances(
        user.id
      );
      setWallets(userWallets);

      // Auto-select default wallet
      const defaultWallet = userWallets.find((w) => w.is_default);
      if (defaultWallet) {
        setSelectedWalletId(defaultWallet.id);
      }
    } catch (error) {
      console.error("Error loading wallets:", error);
    } finally {
      setWalletsLoading(false);
    }
  }, [supabase.auth]);

  useEffect(() => {
    loadUserWallets();
  }, [loadUserWallets]);

  const selectedWallet = wallets.find((w) => w.id === selectedWalletId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("Not authenticated");
      }

      if (!selectedWalletId || !selectedWallet) {
        throw new Error("Please select a wallet");
      }

      const expenseAmount = parseFloat(formData.amount);

      // Check if the expense would result in a negative balance beyond a reasonable limit
      // (We allow negative balances, but warn the user)
      const newBalance = selectedWallet.balance - expenseAmount;
      const showWarning = newBalance < -1000; // Warn if balance would go below -$1000

      if (showWarning) {
        const confirmed = confirm(
          `This expense will bring your ${
            selectedWallet.name
          } balance to ${formatCurrencyWithSymbol(
            newBalance,
            selectedWallet.currency
          )}. ` +
            "Your balance will go significantly negative. Do you want to continue?"
        );
        if (!confirmed) {
          setLoading(false);
          return;
        }
      }

      const expenseData: ExpenseInsert = {
        user_id: user.id,
        wallet_id: selectedWalletId,
        date: formData.date,
        amount: expenseAmount,
        category: formData.category,
        description: formData.description || null,
      };

      const { error } = await supabase.from("expenses").insert([expenseData]);

      if (error) throw error;

      router.push("/dashboard");
    } catch (error) {
      console.error("Error creating expense:", error);
      alert("Failed to create expense. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getNewBalancePreview = () => {
    if (!selectedWallet) return 0;
    const amount = parseFloat(formData.amount) || 0;
    return selectedWallet.balance - amount;
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-4 mb-4">
          <Button variant="ghost" asChild>
            <Link href="/dashboard" className="flex items-center">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
        </div>
        <h1 className="text-3xl font-bold">Add New Expense</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Record a new expense in your petty cash tracker
        </p>
      </div>

      {/* Wallet Selection & Balance Cards */}
      {walletsLoading ? (
        <Card className="mb-6">
          <CardContent className="px-6">
            <div className="animate-pulse">
              <div className="h-6 w-32 bg-muted rounded mb-2"></div>
              <div className="h-8 w-24 bg-muted rounded"></div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Wallet Selection */}
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="text-lg">Select Wallet</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {wallets.map((wallet) => (
                  <div
                    key={wallet.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedWalletId === wallet.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                    onClick={() => setSelectedWalletId(wallet.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-primary/10 rounded-full">
                          <Wallet className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium">{wallet.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {wallet.currency}
                            {wallet.is_default && (
                              <span className="ml-2 bg-primary/10 text-primary text-xs px-2 py-1 rounded">
                                Default
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div
                          className={`text-lg font-bold ${getBalanceColor(
                            wallet.balance
                          )}`}
                        >
                          {formatCurrencyWithSymbol(
                            wallet.balance,
                            wallet.currency
                          )}
                        </div>
                        {wallet.balance < 0 && (
                          <div className="flex items-center text-sm text-destructive mt-1">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Negative
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Balance Preview */}
          {selectedWallet && (
            <Card className="mb-6">
              <CardContent className="px-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Current Balance:
                    </span>
                    <span
                      className={`font-medium ${getBalanceColor(
                        selectedWallet.balance
                      )}`}
                    >
                      {formatCurrencyWithSymbol(
                        selectedWallet.balance,
                        selectedWallet.currency
                      )}
                    </span>
                  </div>

                  {formData.amount && !isNaN(parseFloat(formData.amount)) && (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          Expense Amount:
                        </span>
                        <span className="font-medium text-destructive">
                          -
                          {formatCurrencyWithSymbol(
                            parseFloat(formData.amount),
                            selectedWallet.currency
                          )}
                        </span>
                      </div>

                      <div className="border-t pt-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">
                            Balance After Expense:
                          </span>
                          <span
                            className={`font-bold ${getBalanceColor(
                              getNewBalancePreview()
                            )}`}
                          >
                            {formatCurrencyWithSymbol(
                              getNewBalancePreview(),
                              selectedWallet.currency
                            )}
                          </span>
                        </div>

                        {getNewBalancePreview() < -500 && (
                          <div className="flex items-center text-sm text-amber-600 dark:text-amber-400 mt-2">
                            <AlertTriangle className="h-4 w-4 mr-1" />
                            This will result in a significant negative balance
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Form */}
      <Card>
        <CardContent className="px-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Date */}
            <div className="space-y-2">
              <Label htmlFor="date">Date *</Label>
              <Input
                type="date"
                id="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
              />
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <Label htmlFor="amount">
                Amount {selectedWallet ? `(${selectedWallet.currency})` : ""} *
              </Label>
              <Input
                type="number"
                id="amount"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                step="0.01"
                min="0"
                required
                placeholder="0.00"
              />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select
                name="category"
                value={formData.category}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, category: value }))
                }
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {EXPENSE_CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                placeholder="Optional description of the expense"
              />
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-3">
              <Button variant="outline" asChild>
                <Link href="/dashboard">Cancel</Link>
              </Button>
              <Button type="submit" disabled={loading || !selectedWalletId}>
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Expense
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Tips */}
      <Card className="mt-6 bg-primary/5 border-primary/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-primary">
            Tips for recording expenses:
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Be specific in your descriptions to make tracking easier</li>
            <li>• Choose the most appropriate category for better reporting</li>
            <li>
              • Record expenses as soon as possible to avoid forgetting details
            </li>
            <li>• Keep receipts for verification and tax purposes</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
