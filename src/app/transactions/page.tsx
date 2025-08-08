"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  Edit,
  Save,
  X,
  Trash2,
  History,
  DollarSign,
  Filter,
  Eye,
  EyeOff,
  AlertCircle,
  Wallet,
} from "lucide-react";
import type {
  Expense,
  FundTransactionHistory,
  Currency,
  User,
} from "@/types/database";
import { EXPENSE_CATEGORIES } from "@/types/database";
import { getCurrentUser, checkUserRole } from "@/lib/auth-utils";
import { useWallets } from "@/hooks/api/useWallets";
import { formatCurrencyWithSymbol } from "@/lib/utils/currency";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ExpenseWithHistory extends Expense {
  edit_history?: EditHistoryEntry[];
  wallet?: {
    id: string;
    currency: string;
    name: string;
  };
}

interface EditHistoryEntry {
  id: string;
  expense_id: string;
  edited_by: string;
  editor_username: string;
  previous_data: {
    amount: number;
    category: string;
    description: string | null;
    date: string;
  };
  new_data: {
    amount: number;
    category: string;
    description: string | null;
    date: string;
  };
  edited_at: string;
  reason: string | null;
}

export default function TransactionsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [expenses, setExpenses] = useState<ExpenseWithHistory[]>([]);
  const [fundTransactions, setFundTransactions] = useState<
    FundTransactionHistory[]
  >([]);
  const [viewMode, setViewMode] = useState<"expenses" | "funds">("expenses");
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAllUsers, setShowAllUsers] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<{
    amount: string;
    category: string;
    description: string;
    date: string;
    reason: string;
  }>({
    amount: "",
    category: "",
    description: "",
    date: "",
    reason: "",
  });
  const [showHistoryId, setShowHistoryId] = useState<string | null>(null);
  const [selectedWalletId, setSelectedWalletId] = useState<string>("all");
  const [currentUser, setCurrentUser] = useState<{
    id: string;
    email?: string;
    profile: User;
  } | null>(null);
  const [filter, setFilter] = useState<{
    dateFrom: string;
    dateTo: string;
    category: string;
    minAmount: string;
    maxAmount: string;
  }>({
    dateFrom: "",
    dateTo: "",
    category: "all",
    minAmount: "",
    maxAmount: "",
  });

  // Load wallets for current user
  const { wallets } = useWallets(currentUser?.id);

  const [tempFilter, setTempFilter] = useState<{
    dateFrom: string;
    dateTo: string;
    category: string;
    minAmount: string;
    maxAmount: string;
  }>({
    dateFrom: "",
    dateTo: "",
    category: "all",
    minAmount: "",
    maxAmount: "",
  });

  // Initialize and sync tempFilter when filter changes
  useEffect(() => {
    setTempFilter(filter);
  }, [filter]);

  // Quick date selector functions
  const setQuickDateFilter = (period: "today" | "week" | "month") => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const date = today.getDate();

    let dateFrom = "";
    let dateTo = "";

    switch (period) {
      case "today":
        dateFrom = dateTo = today.toISOString().split("T")[0];
        break;
      case "week":
        const startOfWeek = new Date(today);
        startOfWeek.setDate(date - today.getDay()); // Start of week (Sunday)
        const endOfWeek = new Date(today);
        endOfWeek.setDate(date + (6 - today.getDay())); // End of week (Saturday)
        dateFrom = startOfWeek.toISOString().split("T")[0];
        dateTo = endOfWeek.toISOString().split("T")[0];
        break;
      case "month":
        const startOfMonth = new Date(year, month, 1);
        const endOfMonth = new Date(year, month + 1, 0);
        dateFrom = startOfMonth.toISOString().split("T")[0];
        dateTo = endOfMonth.toISOString().split("T")[0];
        break;
    }

    setTempFilter({ ...tempFilter, dateFrom, dateTo });
  };

  const applyFilters = () => {
    setFilter({ ...tempFilter });
  };

  const clearFilters = () => {
    const clearedFilter = {
      dateFrom: "",
      dateTo: "",
      category: "all",
      minAmount: "",
      maxAmount: "",
    };
    setTempFilter(clearedFilter);
    setFilter(clearedFilter);
  };

  const fetchExpenses = useCallback(async () => {
    try {
      setLoading(true);
      const user = await getCurrentUser();
      setCurrentUser(user);

      if (!user?.profile) {
        console.error("No user or user profile found");
        return;
      }

      const hasAdmin = await checkUserRole("admin");
      setIsAdmin(hasAdmin);

      // Build query parameters
      const params = new URLSearchParams();
      if (hasAdmin && showAllUsers) {
        params.append("allUsers", "true");
      }
      if (filter.dateFrom) params.append("dateFrom", filter.dateFrom);
      if (filter.dateTo) params.append("dateTo", filter.dateTo);
      if (filter.category !== "all") params.append("category", filter.category);
      if (filter.minAmount) params.append("minAmount", filter.minAmount);
      if (filter.maxAmount) params.append("maxAmount", filter.maxAmount);
      if (selectedWalletId !== "all")
        params.append("walletId", selectedWalletId);

      const response = await fetch(
        `/api/transactions/expenses?${params.toString()}`
      );
      if (response.ok) {
        const responseData = await response.json();
        console.log("API Response:", responseData);
        const { expenses: expenseData } = responseData;
        setExpenses(expenseData || []);
      } else {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Unknown error" }));
        console.error(
          "Failed to fetch expenses:",
          response.status,
          response.statusText,
          errorData
        );
        // Set empty array to prevent UI issues
        setExpenses([]);
      }
    } catch (error) {
      console.error("Error fetching expenses:", error);
    } finally {
      setLoading(false);
    }
  }, [showAllUsers, filter, selectedWalletId]);

  const fetchFundTransactions = useCallback(async () => {
    try {
      setLoading(true);
      const hasAdmin = await checkUserRole("admin");

      const params = new URLSearchParams();
      if (hasAdmin && showAllUsers) {
        params.append("allUsers", "true");
      }
      if (filter.dateFrom) params.append("dateFrom", filter.dateFrom);
      if (filter.dateTo) params.append("dateTo", filter.dateTo);

      const response = await fetch(
        `/api/transactions/funds?${params.toString()}`
      );
      if (response.ok) {
        const responseData = await response.json();
        console.log("Fund Transactions API Response:", responseData);
        const { transactions } = responseData;
        setFundTransactions(transactions || []);
      } else {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Unknown error" }));
        console.error(
          "Failed to fetch fund transactions:",
          response.status,
          response.statusText,
          errorData
        );
        // Set empty array to prevent UI issues
        setFundTransactions([]);
      }
    } catch (error) {
      console.error("Error fetching fund transactions:", error);
    } finally {
      setLoading(false);
    }
  }, [showAllUsers, filter]);

  const handleEditExpense = (expense: ExpenseWithHistory) => {
    setEditingId(expense.id);
    setEditData({
      amount: expense.amount.toString(),
      category: expense.category,
      description: expense.description || "",
      date: expense.date,
      reason: "",
    });
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;

    try {
      const response = await fetch(`/api/transactions/expenses/${editingId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: parseFloat(editData.amount),
          category: editData.category,
          description: editData.description || null,
          date: editData.date,
          reason: editData.reason || null,
        }),
      });

      if (response.ok) {
        setEditingId(null);
        await fetchExpenses();
      } else {
        const error = await response.json();
        alert(error.error || "Failed to update expense");
      }
    } catch (error) {
      console.error("Error updating expense:", error);
      alert("Failed to update expense");
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this expense? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/transactions/expenses/${expenseId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await fetchExpenses();
      } else {
        const error = await response.json();
        alert(error.error || "Failed to delete expense");
      }
    } catch (error) {
      console.error("Error deleting expense:", error);
      alert("Failed to delete expense");
    }
  };

  const formatCurrency = (amount: number, currency: string = "USD") => {
    return formatCurrencyWithSymbol(amount, currency as Currency);
  };

  useEffect(() => {
    const checkAccess = async () => {
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        router.push("/auth/login");
        return;
      }

      if (viewMode === "expenses") {
        await fetchExpenses();
      } else {
        await fetchFundTransactions();
      }
    };

    checkAccess();
  }, [router, viewMode, fetchExpenses, fetchFundTransactions, filter]);

  useEffect(() => {
    if (viewMode === "expenses") {
      fetchExpenses();
    } else {
      fetchFundTransactions();
    }
  }, [viewMode, showAllUsers, filter, fetchExpenses, fetchFundTransactions]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">All Transactions</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            View and manage expenses and fund transfers with complete history
          </p>
        </div>

        <div className="flex items-center space-x-4">
          {/* View Toggle */}
          <div className="flex rounded-md shadow-sm">
            <Button
              variant={viewMode === "expenses" ? "default" : "outline"}
              onClick={() => setViewMode("expenses")}
              className="rounded-r-none"
            >
              <DollarSign className="h-4 w-4 mr-1" />
              Expenses
            </Button>
            <Button
              variant={viewMode === "funds" ? "default" : "outline"}
              onClick={() => setViewMode("funds")}
              className="rounded-l-none border-l-0"
            >
              <History className="h-4 w-4 mr-1" />
              Fund Transfers
            </Button>
          </div>

          {/* Admin Toggle */}
          {isAdmin && (
            <Button
              variant={showAllUsers ? "default" : "outline"}
              onClick={() => setShowAllUsers(!showAllUsers)}
            >
              {showAllUsers ? (
                <Eye className="h-4 w-4 mr-2" />
              ) : (
                <EyeOff className="h-4 w-4 mr-2" />
              )}
              {showAllUsers ? "All Users" : "My Transactions"}
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="px-6">
          {/* Quick Date Selectors */}
          <div className="mb-4 flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setQuickDateFilter("today")}
            >
              Today
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setQuickDateFilter("week")}
            >
              This Week
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setQuickDateFilter("month")}
            >
              This Month
            </Button>
            <Button variant="outline" size="sm" onClick={clearFilters}>
              Clear All
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dateFrom">From Date</Label>
              <Input
                id="dateFrom"
                type="date"
                value={tempFilter.dateFrom}
                onChange={(e) =>
                  setTempFilter({ ...tempFilter, dateFrom: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateTo">To Date</Label>
              <Input
                id="dateTo"
                type="date"
                value={tempFilter.dateTo}
                onChange={(e) =>
                  setTempFilter({ ...tempFilter, dateTo: e.target.value })
                }
              />
            </div>

            {viewMode === "expenses" && (
              <>
                <div className="space-y-2">
                  <Label>Wallet</Label>
                  <Select
                    value={selectedWalletId}
                    onValueChange={setSelectedWalletId}
                  >
                    <SelectTrigger>
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
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select
                    value={tempFilter.category}
                    onValueChange={(value) =>
                      setTempFilter({ ...tempFilter, category: value })
                    }
                  >
                    <SelectTrigger>
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
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="minAmount">Min Amount</Label>
              <Input
                id="minAmount"
                type="number"
                step="0.01"
                value={tempFilter.minAmount}
                onChange={(e) =>
                  setTempFilter({ ...tempFilter, minAmount: e.target.value })
                }
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxAmount">Max Amount</Label>
              <Input
                id="maxAmount"
                type="number"
                step="0.01"
                value={tempFilter.maxAmount}
                onChange={(e) =>
                  setTempFilter({ ...tempFilter, maxAmount: e.target.value })
                }
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Filter Actions */}
          <div className="flex justify-end mt-4 space-x-2">
            <Button variant="outline" onClick={clearFilters}>
              Clear
            </Button>
            <Button onClick={applyFilters}>Apply Filters</Button>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            {viewMode === "expenses"
              ? "Expense Transactions"
              : "Fund Transfers"}{" "}
            (
            {viewMode === "expenses"
              ? expenses.length
              : fundTransactions.length}
            )
          </CardTitle>
        </CardHeader>

        <CardContent className="p-0">
          {viewMode === "expenses" ? (
            expenses.length === 0 ? (
              <div className="text-center py-12">
                <DollarSign className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-2 text-sm font-medium">No expenses found</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  No expenses match your current filters.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-900">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Date
                      </th>
                      {showAllUsers && (
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          User
                        </th>
                      )}
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Wallet
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {expenses.map((expense) => (
                      <tr
                        key={expense.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                          {editingId === expense.id ? (
                            <input
                              type="date"
                              value={editData.date}
                              onChange={(e) =>
                                setEditData({
                                  ...editData,
                                  date: e.target.value,
                                })
                              }
                              className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700"
                            />
                          ) : (
                            format(new Date(expense.date), "MMM dd, yyyy")
                          )}
                        </td>
                        {showAllUsers && (
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                            {/* User info would come from joined data */}
                            User {expense.user_id.slice(0, 8)}...
                          </td>
                        )}
                        <td className="px-6 py-4 whitespace-nowrap">
                          {editingId === expense.id ? (
                            <select
                              value={editData.category}
                              onChange={(e) =>
                                setEditData({
                                  ...editData,
                                  category: e.target.value,
                                })
                              }
                              className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700"
                            >
                              {EXPENSE_CATEGORIES.map((category) => (
                                <option key={category} value={category}>
                                  {category}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                              {expense.category}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                          {expense.wallet ? (
                            <div className="flex items-center space-x-2">
                              <Wallet className="h-4 w-4 text-muted-foreground" />
                              <span>{expense.wallet.name}</span>
                              <Badge variant="outline" className="text-xs">
                                {expense.wallet.currency}
                              </Badge>
                            </div>
                          ) : (
                            <Badge variant="secondary" className="text-xs">
                              Unknown
                            </Badge>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                          {editingId === expense.id ? (
                            <input
                              type="text"
                              value={editData.description}
                              onChange={(e) =>
                                setEditData({
                                  ...editData,
                                  description: e.target.value,
                                })
                              }
                              className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700"
                              placeholder="Description..."
                            />
                          ) : (
                            expense.description || "No description"
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                          {editingId === expense.id ? (
                            <input
                              type="number"
                              step="0.01"
                              value={editData.amount}
                              onChange={(e) =>
                                setEditData({
                                  ...editData,
                                  amount: e.target.value,
                                })
                              }
                              className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700"
                            />
                          ) : (
                            formatCurrency(
                              expense.amount,
                              expense.wallet?.currency || "USD"
                            )
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            {editingId === expense.id ? (
                              <>
                                <button
                                  onClick={handleSaveEdit}
                                  className="text-green-600 hover:text-green-900 dark:hover:text-green-400 p-1 rounded hover:bg-green-50 dark:hover:bg-green-900/20"
                                  title="Save changes"
                                >
                                  <Save className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => setEditingId(null)}
                                  className="text-gray-600 hover:text-gray-900 dark:hover:text-gray-400 p-1 rounded hover:bg-gray-50 dark:hover:bg-gray-900/20"
                                  title="Cancel"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => handleEditExpense(expense)}
                                  className="text-blue-600 hover:text-blue-900 dark:hover:text-blue-400 p-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                  title="Edit expense"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() =>
                                    setShowHistoryId(
                                      showHistoryId === expense.id
                                        ? null
                                        : expense.id
                                    )
                                  }
                                  className="text-purple-600 hover:text-purple-900 dark:hover:text-purple-400 p-1 rounded hover:bg-purple-50 dark:hover:bg-purple-900/20"
                                  title="View edit history"
                                >
                                  <History className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() =>
                                    handleDeleteExpense(expense.id)
                                  }
                                  className="text-red-600 hover:text-red-900 dark:hover:text-red-400 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
                                  title="Delete expense"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : // Fund Transactions Table
          fundTransactions.length === 0 ? (
            <div className="text-center py-12">
              <History className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-medium">
                No fund transactions found
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                No fund transfers match your current filters.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Date
                    </th>
                    {showAllUsers && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        User
                      </th>
                    )}
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Sender
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Recipient
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Transaction Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Balance After
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {fundTransactions.map((transaction) => (
                    <tr
                      key={transaction.transaction_id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {format(
                          new Date(transaction.created_at),
                          "MMM dd, yyyy HH:mm"
                        )}
                      </td>
                      {showAllUsers && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                          {transaction.username || "Unknown User"}
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {transaction.sender}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {transaction.recipient}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            transaction.display_type === "credit"
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                              : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                          }`}
                        >
                          {transaction.display_type === "credit"
                            ? "Credit"
                            : "Debit"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                        {transaction.description || "No description"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <span
                          className={
                            transaction.display_type === "credit"
                              ? "text-green-600 dark:text-green-400"
                              : "text-red-600 dark:text-red-400"
                          }
                        >
                          {transaction.display_type === "credit" ? "+" : "-"}
                          {formatCurrency(transaction.amount)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {formatCurrency(transaction.new_balance)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Reason Modal */}
      {editingId && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  Edit Reason
                </h3>
                <button
                  onClick={() => setEditingId(null)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Reason for Edit (Optional)
                </label>
                <textarea
                  value={editData.reason}
                  onChange={(e) =>
                    setEditData({ ...editData, reason: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder="Why are you making this change?"
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setEditingId(null)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit History Modal */}
      {showHistoryId && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border max-w-4xl shadow-lg rounded-md bg-white dark:bg-gray-800">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  Edit History
                </h3>
                <button
                  onClick={() => setShowHistoryId(null)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="max-h-96 overflow-y-auto">
                {(() => {
                  const expense = expenses.find((e) => e.id === showHistoryId);
                  const history = expense?.edit_history || [];

                  return history.length === 0 ? (
                    <div className="text-center py-8">
                      <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                        No edit history
                      </h3>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        This expense has not been edited yet.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {history.map((edit, index) => (
                        <div
                          key={edit.id}
                          className="border border-gray-200 dark:border-gray-600 rounded-lg p-4"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                Edit #{history.length - index}
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                by {edit.editor_username}
                              </span>
                            </div>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {format(
                                new Date(edit.edited_at),
                                "MMM dd, yyyy HH:mm"
                              )}
                            </span>
                          </div>

                          {edit.reason && (
                            <div className="mb-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-sm">
                              <strong>Reason:</strong> {edit.reason}
                            </div>
                          )}

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div>
                              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                                Previous Values
                              </h4>
                              <div className="space-y-1 text-gray-600 dark:text-gray-400">
                                <div>
                                  Amount:{" "}
                                  {formatCurrency(edit.previous_data.amount)}
                                </div>
                                <div>
                                  Category: {edit.previous_data.category}
                                </div>
                                <div>
                                  Description:{" "}
                                  {edit.previous_data.description || "None"}
                                </div>
                                <div>
                                  Date:{" "}
                                  {format(
                                    new Date(edit.previous_data.date),
                                    "MMM dd, yyyy"
                                  )}
                                </div>
                              </div>
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                                New Values
                              </h4>
                              <div className="space-y-1 text-gray-600 dark:text-gray-400">
                                <div>
                                  Amount: {formatCurrency(edit.new_data.amount)}
                                </div>
                                <div>Category: {edit.new_data.category}</div>
                                <div>
                                  Description:{" "}
                                  {edit.new_data.description || "None"}
                                </div>
                                <div>
                                  Date:{" "}
                                  {format(
                                    new Date(edit.new_data.date),
                                    "MMM dd, yyyy"
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowHistoryId(null)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
