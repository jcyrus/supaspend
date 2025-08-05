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
import type { Expense, FundTransactionHistory } from "@/types/database";
import { EXPENSE_CATEGORIES } from "@/types/database";
import { getCurrentUser } from "@/lib/auth-utils";

export default function DashboardContent() {
  const supabase = createClient();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "month" | "week">("month");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [balance, setBalance] = useState<number>(0);
  const [balanceLoading, setBalanceLoading] = useState(true);
  const [recentTransactions, setRecentTransactions] = useState<
    FundTransactionHistory[]
  >([]);

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
        const { balance: userBalance, transactions } = await response.json();
        setBalance(userBalance);
        setRecentTransactions(transactions?.slice(0, 5) || []);
      } else {
        console.error("Failed to fetch balance");
        setBalance(0);
        setRecentTransactions([]);
      }
    } catch (error) {
      console.error("Error fetching balance:", error);
      setBalance(0);
      setRecentTransactions([]);
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
    if (balance < 0) return "text-red-600 dark:text-red-400";
    if (balance === 0) return "text-gray-600 dark:text-gray-400";
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
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Wallet className="h-8 w-8 text-indigo-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-300 truncate">
                  Available Balance
                </dt>
                <dd
                  className={`text-lg font-medium ${getBalanceColor(balance)}`}
                >
                  {balanceLoading ? (
                    <div className="animate-pulse h-6 bg-gray-200 dark:bg-gray-600 rounded w-20"></div>
                  ) : (
                    <>
                      {formatCurrency(balance)}
                      {balance < 0 && (
                        <div className="flex items-center text-xs text-red-600 dark:text-red-400 mt-1">
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
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-300 truncate">
                  Total Expenses (
                  {filter === "month"
                    ? "This Month"
                    : filter === "week"
                    ? "Last 7 Days"
                    : "All Time"}
                  )
                </dt>
                <dd className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  ${totalAmount.toFixed(2)}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Calendar className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-300 truncate">
                  This Month&apos;s Expenses
                </dt>
                <dd className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  $
                  {thisMonthExpenses
                    .reduce((sum, expense) => sum + expense.amount, 0)
                    .toFixed(2)}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-300 truncate">
                  Number of Expenses
                </dt>
                <dd className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  {expenses.length}
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
          <div className="flex items-center space-x-4">
            <Filter className="h-5 w-5 text-gray-400" />
            <div className="flex space-x-2">
              {(["all", "month", "week"] as const).map((filterOption) => (
                <button
                  key={filterOption}
                  onClick={() => setFilter(filterOption)}
                  className={`px-3 py-1 rounded-md text-sm font-medium ${
                    filter === filterOption
                      ? "bg-blue-100 text-blue-700 dark:bg-blue-800 dark:text-blue-300"
                      : "text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700"
                  }`}
                >
                  {filterOption === "all"
                    ? "All Time"
                    : filterOption === "month"
                    ? "This Month"
                    : "Last 7 Days"}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-1 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Categories</option>
              {EXPENSE_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Recent Expenses */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100">
              Recent Expenses
            </h2>
            <Link
              href="/expenses/new"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Add New Expense
            </Link>
          </div>
        </div>

        <div className="overflow-hidden">
          {expenses.length === 0 ? (
            <div className="text-center py-12">
              <DollarSign className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                No expenses found
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Get started by adding your first expense.
              </p>
              <div className="mt-6">
                <Link
                  href="/expenses/new"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  Add Expense
                </Link>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {expenses.slice(0, 10).map((expense) => (
                    <tr
                      key={expense.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                        {format(new Date(expense.date), "MMM dd, yyyy")}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                          {expense.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                        {expense.description || "No description"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                        ${expense.amount.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {expenses.length > 10 && (
          <div className="px-6 py-3 border-t border-gray-200 dark:border-gray-700 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Showing 10 of {expenses.length} expenses
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
