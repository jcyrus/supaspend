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
} from "lucide-react";
import Link from "next/link";
import type { Expense } from "@/types/database";
import { EXPENSE_CATEGORIES } from "@/types/database";
import { getCurrentUser } from "@/lib/auth-utils";
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
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "month" | "week">("month");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [balance, setBalance] = useState<number>(0);
  const [balanceLoading, setBalanceLoading] = useState(true);

  const fetchExpenses = useCallback(async () => {
    try {
      setLoading(true);

      // Use enhanced getCurrentUser function that creates profile if missing
      const currentUser = await getCurrentUser();

      if (!currentUser?.profile) {
        console.error("No user or user profile found");
        setExpenses([]);
        return;
      }

      console.log("Fetching expenses for user:", {
        id: currentUser.id,
        email: currentUser.email,
        role: currentUser.profile.role,
      });

      let query = supabase
        .from("expenses")
        .select("*")
        .eq("user_id", currentUser.id)
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

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching expenses:", error);
        console.error("Error details:", {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
        });
        console.error("User ID:", currentUser.id);
        console.error("Query filters:", { filter, categoryFilter });
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
  }, [supabase, filter, categoryFilter]);

  const fetchBalance = useCallback(async () => {
    try {
      setBalanceLoading(true);
      const response = await fetch("/api/balance");
      if (response.ok) {
        const { balance: userBalance } = await response.json();
        setBalance(userBalance);
      } else {
        console.error("Failed to fetch balance");
        setBalance(0);
      }
    } catch (error) {
      console.error("Error fetching balance:", error);
      setBalance(0);
    } finally {
      setBalanceLoading(false);
    }
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const getBalanceColor = (balance: number) => {
    if (balance < 0) return "text-destructive";
    if (balance === 0) return "text-muted-foreground";
    return "text-green-600 dark:text-green-400";
  };

  useEffect(() => {
    fetchExpenses();
    fetchBalance();
  }, [fetchExpenses, fetchBalance]);

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
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Wallet className="h-8 w-8 text-indigo-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-muted-foreground truncate">
                    Available Balance
                  </dt>
                  <dd
                    className={`text-lg font-medium ${getBalanceColor(
                      balance
                    )}`}
                  >
                    {balanceLoading ? (
                      <div className="animate-pulse h-6 bg-muted rounded w-20"></div>
                    ) : (
                      <>
                        {formatCurrency(balance)}
                        {balance < 0 && (
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
          <CardContent className="p-6">
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
                    ${totalAmount.toFixed(2)}
                  </dd>
                </dl>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
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
                    $
                    {thisMonthExpenses
                      .reduce((sum, expense) => sum + expense.amount, 0)
                      .toFixed(2)}
                  </dd>
                </dl>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
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
        <CardContent className="p-4">
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

        <CardContent className="p-0">
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
                    <TableCell className="font-medium">
                      ${expense.amount.toFixed(2)}
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
