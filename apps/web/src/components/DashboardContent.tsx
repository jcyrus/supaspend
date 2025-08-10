"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState, useCallback } from "react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import {
  DollarSign,
  TrendingUp,
  Calendar,
  Filter,
  Wallet,
  AlertTriangle,
  Plus,
} from "lucide-react";
import Link from "next/link";
import type { Expense, Currency, User } from "@/types/database";

// Expense with wallet information
type ExpenseWithWallet = Expense & {
  wallet?: {
    id: string;
    name: string;
    currency: Currency;
  };
};
import { EXPENSE_CATEGORIES } from "@/types/database";
import { getCurrentUser } from "@/lib/auth-utils";
import { useWallets, useWalletBalances } from "@/hooks/api/useWallets";
import {
  formatCurrencyWithSymbol,
  getBalanceColor,
} from "@/lib/utils/currency";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function DashboardContent() {
  const supabase = createClient();
  const [expenses, setExpenses] = useState<ExpenseWithWallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "month" | "week">("month");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [selectedWalletId, setSelectedWalletId] = useState<string>("all");
  const [currentUser, setCurrentUser] = useState<{
    id: string;
    email?: string;
    profile: User;
  } | null>(null);

  // Load wallets for current user
  const { wallets, loading: walletsLoading } = useWallets(currentUser?.id);
  const { balances, loading: balancesLoading } = useWalletBalances(wallets);

  // Calculate total balance across all wallets
  const totalBalance = Object.values(balances).reduce(
    (sum, balance) => sum + balance,
    0
  );
  const selectedWallet = wallets.find((w) => w.id === selectedWalletId);
  const selectedWalletBalance =
    selectedWalletId === "all" ? totalBalance : balances[selectedWalletId] || 0;

  const fetchExpenses = useCallback(async () => {
    try {
      setLoading(true);

      // Use enhanced getCurrentUser function that creates profile if missing
      const user = await getCurrentUser();
      setCurrentUser(user);

      if (!user?.profile) {
        console.error("No user or user profile found");
        setExpenses([]);
        return;
      }

      console.log("Fetching expenses for user:", {
        id: user.id,
        email: user.email,
        role: user.profile.role,
      });

      let query = supabase
        .from("expenses")
        .select(
          `
          *,
          wallet:wallets(id, currency, name)
        `
        )
        .eq("user_id", user.id)
        .order("date", { ascending: false });

      // Apply date filter
      const now = new Date();
      if (filter === "month") {
        const startDate = startOfMonth(now);
        const endDate = endOfMonth(now);
        query = query
          .gte("date", format(startDate, "yyyy-MM-dd"))
          .lte("date", format(endDate, "yyyy-MM-dd"));
      } else if (filter === "week") {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        query = query.gte("date", format(weekAgo, "yyyy-MM-dd"));
      }

      // Apply category filter
      if (categoryFilter !== "all") {
        query = query.eq("category", categoryFilter);
      }

      // Apply wallet filter
      if (selectedWalletId !== "all") {
        query = query.eq("wallet_id", selectedWalletId);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching expenses:", error);
        console.error("Error details:", {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
        });
        console.error("User ID:", user.id);
        console.error("Query filters:", {
          filter,
          categoryFilter,
          selectedWalletId,
        });
        throw error;
      }

      console.log(
        "Expenses fetched successfully:",
        data?.length || 0,
        "records"
      );
      setExpenses(data || []);
    } catch (error) {
      console.error("Error fetching expenses:", error);
      console.error("Full error object:", error);
      // Set empty array on error to prevent crashes
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  }, [supabase, filter, categoryFilter, selectedWalletId]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const totalAmount = expenses.reduce(
    (sum, expense) => sum + expense.amount,
    0
  );
  const thisMonthExpenses = expenses.filter((expense) => {
    const expenseDate = new Date(expense.date);
    const now = new Date();
    return (
      expenseDate.getMonth() === now.getMonth() &&
      expenseDate.getFullYear() === now.getFullYear()
    );
  });

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-6"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white dark:bg-gray-800 rounded-lg shadow p-6"
            >
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Dashboard
        </h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
          Overview of your expense tracking and spending patterns
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {/* Balance Card */}
        <Card>
          <CardContent className="px-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Wallet className="h-8 w-8 text-indigo-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-muted-foreground truncate">
                    {selectedWalletId === "all"
                      ? "Total Balance"
                      : `${selectedWallet?.name || "Wallet"} Balance`}
                  </dt>
                  <dd
                    className={`text-lg font-medium ${getBalanceColor(
                      selectedWalletBalance
                    )}`}
                  >
                    {balancesLoading || walletsLoading ? (
                      <div className="animate-pulse h-6 bg-muted rounded w-20"></div>
                    ) : (
                      <>
                        {selectedWalletId === "all" || !selectedWallet
                          ? formatCurrencyWithSymbol(
                              selectedWalletBalance,
                              "USD"
                            )
                          : formatCurrencyWithSymbol(
                              selectedWalletBalance,
                              selectedWallet.currency
                            )}
                        {selectedWalletBalance < 0 && (
                          <div className="flex items-center text-xs text-destructive mt-1">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Negative
                          </div>
                        )}
                      </>
                    )}
                  </dd>
                </dl>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="px-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-muted-foreground truncate">
                    Total Expenses (
                    {filter === "month"
                      ? "This Month"
                      : filter === "week"
                      ? "Last 7 Days"
                      : "All Time"}
                    )
                  </dt>
                  <dd className="text-lg font-medium">
                    {selectedWalletId === "all" || !selectedWallet
                      ? formatCurrencyWithSymbol(totalAmount, "USD")
                      : formatCurrencyWithSymbol(
                          totalAmount,
                          selectedWallet.currency
                        )}
                  </dd>
                </dl>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="px-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Calendar className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-muted-foreground truncate">
                    This Month&apos;s Expenses
                  </dt>
                  <dd className="text-lg font-medium">
                    {(() => {
                      const monthlyTotal = thisMonthExpenses.reduce(
                        (sum, expense) => sum + expense.amount,
                        0
                      );
                      return selectedWalletId === "all" || !selectedWallet
                        ? formatCurrencyWithSymbol(monthlyTotal, "USD")
                        : formatCurrencyWithSymbol(
                            monthlyTotal,
                            selectedWallet.currency
                          );
                    })()}
                  </dd>
                </dl>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="px-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-muted-foreground truncate">
                    Number of Expenses
                  </dt>
                  <dd className="text-lg font-medium">{expenses.length}</dd>
                </dl>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="px-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
            <div className="flex items-center space-x-4">
              <Filter className="h-5 w-5 text-muted-foreground" />
              <div className="flex space-x-2">
                {(["all", "month", "week"] as const).map((filterOption) => (
                  <Button
                    key={filterOption}
                    variant={filter === filterOption ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setFilter(filterOption)}
                  >
                    {filterOption === "all"
                      ? "All Time"
                      : filterOption === "month"
                      ? "This Month"
                      : "Last 7 Days"}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {/* Wallet Filter */}
              <Select
                value={selectedWalletId}
                onValueChange={setSelectedWalletId}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Wallets" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Wallets</SelectItem>
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

              {/* Category Filter */}
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {EXPENSE_CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Wallet Overview */}
      {wallets.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <Wallet className="h-5 w-5 mr-2" />
                My Wallets
              </CardTitle>
              <Button asChild size="sm">
                <Link href="/wallets">
                  <Plus className="h-4 w-4 mr-1" />
                  Manage Wallets
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {wallets.map((wallet) => (
                <Card
                  key={wallet.id}
                  className={`${
                    wallet.is_default ? "ring-2 ring-primary" : ""
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium">{wallet.name}</h4>
                        {wallet.is_default && (
                          <Badge variant="secondary" className="text-xs">
                            Default
                          </Badge>
                        )}
                      </div>
                      <Badge variant="outline">{wallet.currency}</Badge>
                    </div>
                    <div
                      className={`text-lg font-semibold ${getBalanceColor(
                        balances[wallet.id] || 0
                      )}`}
                    >
                      {balancesLoading ? (
                        <div className="animate-pulse h-6 bg-muted rounded w-20"></div>
                      ) : (
                        formatCurrencyWithSymbol(
                          balances[wallet.id] || 0,
                          wallet.currency
                        )
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Expenses */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Expenses</CardTitle>
            <Button asChild>
              <Link href="/expenses/new">Add New Expense</Link>
            </Button>
          </div>
        </CardHeader>

        <CardContent className="px-6">
          {expenses.length === 0 ? (
            <div className="text-center py-12">
              <DollarSign className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-medium">No expenses found</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Get started by adding your first expense.
              </p>
              <div className="mt-6">
                <Button asChild>
                  <Link href="/expenses/new">Add Expense</Link>
                </Button>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Wallet</TableHead>
                  <TableHead>Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.slice(0, 10).map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell>
                      {format(new Date(expense.date), "MMM dd, yyyy")}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{expense.category}</Badge>
                    </TableCell>
                    <TableCell>
                      {expense.description || "No description"}
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const wallet = expense.wallet;
                        return wallet ? (
                          <div className="flex items-center space-x-1">
                            <span className="text-sm">{wallet.name}</span>
                            <Badge variant="outline" className="text-xs">
                              {wallet.currency}
                            </Badge>
                          </div>
                        ) : (
                          <Badge variant="secondary" className="text-xs">
                            Unknown
                          </Badge>
                        );
                      })()}
                    </TableCell>
                    <TableCell className="font-medium">
                      {(() => {
                        const walletCurrency =
                          expense.wallet?.currency || "USD";
                        return formatCurrencyWithSymbol(
                          expense.amount,
                          walletCurrency
                        );
                      })()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {expenses.length > 10 && (
            <div className="px-6 py-3 border-t text-center">
              <p className="text-sm text-muted-foreground">
                Showing 10 of {expenses.length} expenses
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
