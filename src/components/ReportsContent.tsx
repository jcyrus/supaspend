"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState, useCallback } from "react";
import { format, subMonths } from "date-fns";
import { Doughnut, Bar, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
import {
  Calendar,
  Download,
  TrendingUp,
  Users,
  User,
  Wallet,
  AlertTriangle,
} from "lucide-react";
import type { Expense, AdminUserExpense } from "@/types/database";
import { getAdminUserExpenses, checkUserRole } from "@/lib/auth-utils";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

export default function ReportsContent() {
  const supabase = createClient();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [adminUserExpenses, setAdminUserExpenses] = useState<
    AdminUserExpense[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [viewMode, setViewMode] = useState<"personal" | "admin">("personal");
  const [selectedPeriod, setSelectedPeriod] = useState<
    "3months" | "6months" | "1year"
  >("3months");
  const [balance, setBalance] = useState<number>(0);
  const [balanceLoading, setBalanceLoading] = useState(true);
  const [userBalances, setUserBalances] = useState<{ [key: string]: number }>(
    {}
  );

  const checkAdminStatus = useCallback(async () => {
    const hasAdminAccess = await checkUserRole("admin");
    setIsAdmin(hasAdminAccess);
  }, []);

  const fetchPersonalExpenses = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const monthsBack =
        selectedPeriod === "3months"
          ? 3
          : selectedPeriod === "6months"
          ? 6
          : 12;
      const startDate = subMonths(new Date(), monthsBack);

      const { data, error } = await supabase
        .from("expenses")
        .select("*")
        .eq("user_id", user.id)
        .gte("date", format(startDate, "yyyy-MM-dd"))
        .order("date", { ascending: true });

      if (error) throw error;
      setExpenses(data || []);
    } catch (error) {
      console.error("Error fetching personal expenses:", error);
    }
  }, [supabase, selectedPeriod]);

  const fetchAdminExpenses = useCallback(async () => {
    try {
      const adminExpenses = await getAdminUserExpenses();

      // Filter by selected period
      const monthsBack =
        selectedPeriod === "3months"
          ? 3
          : selectedPeriod === "6months"
          ? 6
          : 12;
      const startDate = subMonths(new Date(), monthsBack);

      const filteredExpenses = adminExpenses.filter(
        (expense) => new Date(expense.date) >= startDate
      );

      setAdminUserExpenses(filteredExpenses);
    } catch (error) {
      console.error("Error fetching admin user expenses:", error);
    }
  }, [selectedPeriod]);

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
    if (balance < 0) return "text-red-600 dark:text-red-400";
    if (balance === 0) return "text-gray-600 dark:text-gray-400";
    return "text-green-600 dark:text-green-400";
  };

  const fetchUserBalances = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/users-with-balances");
      if (response.ok) {
        const responseData = await response.json();
        const { data } = responseData;
        const { users } = data || {};

        // Ensure users is an array before processing
        if (Array.isArray(users)) {
          const balances: { [key: string]: number } = {};
          users.forEach((user: { user_id: string; balance: number }) => {
            balances[user.user_id] = user.balance;
          });
          setUserBalances(balances);
        } else {
          console.error("Invalid users data format:", users);
          setUserBalances({});
        }
      } else {
        console.error("Failed to fetch user balances");
        setUserBalances({});
      }
    } catch (error) {
      console.error("Error fetching user balances:", error);
      setUserBalances({});
    }
  }, []);

  const fetchExpenses = useCallback(async () => {
    setLoading(true);

    // First check admin status
    await checkAdminStatus();

    // Fetch balance for personal view or user balances for admin view
    if (viewMode === "personal") {
      await Promise.all([fetchPersonalExpenses(), fetchBalance()]);
    } else if (viewMode === "admin") {
      await Promise.all([fetchAdminExpenses(), fetchUserBalances()]);
    }

    setLoading(false);
  }, [
    viewMode,
    checkAdminStatus,
    fetchPersonalExpenses,
    fetchAdminExpenses,
    fetchBalance,
    fetchUserBalances,
  ]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  // Refetch data when period changes
  useEffect(() => {
    setLoading(true);
    if (viewMode === "personal") {
      Promise.all([fetchPersonalExpenses(), fetchBalance()]).finally(() =>
        setLoading(false)
      );
    } else if (viewMode === "admin") {
      Promise.all([fetchAdminExpenses(), fetchUserBalances()]).finally(() =>
        setLoading(false)
      );
    }
  }, [
    selectedPeriod,
    viewMode,
    fetchPersonalExpenses,
    fetchAdminExpenses,
    fetchBalance,
    fetchUserBalances,
  ]);

  // Get the data based on view mode
  const currentExpenses: Expense[] =
    viewMode === "personal"
      ? expenses
      : (adminUserExpenses || []).map((e) => ({
          id: e.expense_id,
          user_id: e.user_id,
          date: e.date,
          amount: e.amount,
          category: e.category,
          description: e.description,
          created_at: e.created_at,
          updated_at: e.created_at,
        }));

  const totalAmount = currentExpenses.reduce(
    (sum, expense) => sum + expense.amount,
    0
  );

  // Calculate category data
  const categoryData = currentExpenses.reduce(
    (acc: { [key: string]: number }, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
      return acc;
    },
    {}
  );

  // Calculate monthly data
  const monthlyData = currentExpenses.reduce(
    (acc: { [key: string]: number }, expense) => {
      const month = format(new Date(expense.date), "MMM yyyy");
      acc[month] = (acc[month] || 0) + expense.amount;
      return acc;
    },
    {}
  );

  const categoryChartData = {
    labels: Object.keys(categoryData),
    datasets: [
      {
        data: Object.values(categoryData),
        backgroundColor: [
          "#3B82F6",
          "#EF4444",
          "#10B981",
          "#F59E0B",
          "#8B5CF6",
          "#EC4899",
          "#6B7280",
          "#84CC16",
          "#06B6D4",
        ],
        borderWidth: 0,
      },
    ],
  };

  const monthlyChartData = {
    labels: Object.keys(monthlyData),
    datasets: [
      {
        label: "Monthly Expenses",
        data: Object.values(monthlyData),
        backgroundColor: "#3B82F6",
        borderColor: "#2563EB",
        borderWidth: 1,
      },
    ],
  };

  const trendChartData = {
    labels: Object.keys(monthlyData),
    datasets: [
      {
        label: "Expense Trend",
        data: Object.values(monthlyData),
        borderColor: "#3B82F6",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom" as const,
      },
    },
  };

  const downloadReport = () => {
    const csvContent = [
      [
        "Date",
        "Category",
        "Amount",
        "Description",
        ...(viewMode === "admin" ? ["User", "Email"] : []),
      ],
      ...(viewMode === "personal"
        ? (currentExpenses || []).map((expense) => [
            expense.date,
            expense.category,
            expense.amount.toString(),
            expense.description || "",
          ])
        : (adminUserExpenses || []).map((expense) => [
            expense.date,
            expense.category,
            expense.amount.toString(),
            expense.description || "",
            expense.username,
            expense.user_email,
          ])),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `expenses-report-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
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
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {viewMode === "admin" ? "Admin Reports" : "Expense Reports"}
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            {viewMode === "admin"
              ? "View expense reports for users you manage"
              : "Analyze your spending patterns and trends"}
          </p>
        </div>
        <div className="flex items-center space-x-4">
          {isAdmin && (
            <div className="flex rounded-md shadow-sm">
              <button
                onClick={() => setViewMode("personal")}
                className={`px-4 py-2 text-sm font-medium rounded-l-md border ${
                  viewMode === "personal"
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600"
                }`}
              >
                <User className="h-4 w-4 inline mr-1" />
                Personal
              </button>
              <button
                onClick={() => setViewMode("admin")}
                className={`px-4 py-2 text-sm font-medium rounded-r-md border-t border-r border-b ${
                  viewMode === "admin"
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600"
                }`}
              >
                <Users className="h-4 w-4 inline mr-1" />
                Admin View
              </button>
            </div>
          )}
          <button
            onClick={downloadReport}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md flex items-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-gray-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Time Period:
            </span>
          </div>
          <div className="flex space-x-2">
            {[
              { value: "3months" as const, label: "3 Months" },
              { value: "6months" as const, label: "6 Months" },
              { value: "1year" as const, label: "1 Year" },
            ].map((period) => (
              <button
                key={period.value}
                onClick={() => setSelectedPeriod(period.value)}
                className={`px-3 py-1 rounded-md text-sm font-medium ${
                  selectedPeriod === period.value
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                }`}
              >
                {period.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {/* Balance Card - Personal View */}
        {viewMode === "personal" && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Wallet className="h-8 w-8 text-indigo-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  Available Balance
                </p>
                <div
                  className={`text-2xl font-semibold ${getBalanceColor(
                    balance
                  )}`}
                >
                  {balanceLoading ? (
                    <div className="animate-pulse h-8 bg-gray-200 dark:bg-gray-600 rounded w-20"></div>
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
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Total Balance Card - Admin View */}
        {viewMode === "admin" && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Wallet className="h-8 w-8 text-indigo-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  Total User Balances
                </p>
                <div
                  className={`text-2xl font-semibold ${getBalanceColor(
                    Object.values(userBalances).reduce(
                      (sum, bal) => sum + bal,
                      0
                    )
                  )}`}
                >
                  {formatCurrency(
                    Object.values(userBalances).reduce(
                      (sum, bal) => sum + bal,
                      0
                    )
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                Total Expenses
              </p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                ${totalAmount.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Calendar className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                {viewMode === "admin" ? "Users Tracked" : "Transactions"}
              </p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                {viewMode === "admin"
                  ? new Set((adminUserExpenses || []).map((e) => e.user_id))
                      .size
                  : currentExpenses.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                Average per Month
              </p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                $
                {Object.keys(monthlyData).length > 0
                  ? (totalAmount / Object.keys(monthlyData).length).toFixed(2)
                  : "0.00"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
            Expenses by Category
          </h3>
          <div className="h-64">
            {Object.keys(categoryData).length > 0 ? (
              <Doughnut data={categoryChartData} options={chartOptions} />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                {viewMode === "admin"
                  ? "No user expenses found for the selected period"
                  : "No expenses found for the selected period"}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
            Monthly Spending
          </h3>
          <div className="h-64">
            {Object.keys(monthlyData).length > 0 ? (
              <Bar data={monthlyChartData} options={chartOptions} />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                {viewMode === "admin"
                  ? "No user expenses found for the selected period"
                  : "No expenses found for the selected period"}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Trend Chart or User Summary */}
      {viewMode === "admin" ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
            User Summary
          </h3>
          {adminUserExpenses.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Balance
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Total Expenses
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Transactions
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Average per Month
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {(() => {
                    // Group expenses by user
                    const userSummary = adminUserExpenses.reduce(
                      (acc, expense) => {
                        const userId = expense.user_id;
                        if (!acc[userId]) {
                          acc[userId] = {
                            username: expense.username,
                            email: expense.user_email,
                            totalAmount: 0,
                            transactionCount: 0,
                            monthlyData: {},
                          };
                        }
                        acc[userId].totalAmount += expense.amount;
                        acc[userId].transactionCount += 1;

                        // Track monthly data for average calculation
                        const month = format(
                          new Date(expense.date),
                          "MMM yyyy"
                        );
                        acc[userId].monthlyData[month] =
                          (acc[userId].monthlyData[month] || 0) +
                          expense.amount;

                        return acc;
                      },
                      {} as Record<
                        string,
                        {
                          username: string;
                          email: string;
                          totalAmount: number;
                          transactionCount: number;
                          monthlyData: Record<string, number>;
                        }
                      >
                    );

                    return Object.entries(userSummary).map(
                      ([userId, summary]) => (
                        <tr
                          key={userId}
                          className="hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                {summary.username}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {summary.email}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`text-sm font-medium ${getBalanceColor(
                                userBalances[userId] || 0
                              )}`}
                            >
                              {formatCurrency(userBalances[userId] || 0)}
                              {(userBalances[userId] || 0) < 0 && (
                                <div className="flex items-center text-xs text-red-600 dark:text-red-400 mt-1">
                                  <AlertTriangle className="h-3 w-3 mr-1" />
                                  Negative
                                </div>
                              )}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                            ${summary.totalAmount.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                            {summary.transactionCount}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                            $
                            {Object.keys(summary.monthlyData).length > 0
                              ? (
                                  summary.totalAmount /
                                  Object.keys(summary.monthlyData).length
                                ).toFixed(2)
                              : "0.00"}
                          </td>
                        </tr>
                      )
                    );
                  })()}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex items-center justify-center h-32 text-gray-500 dark:text-gray-400">
              No user expenses found for the selected period
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
            Spending Trend
          </h3>
          <div className="h-64">
            {Object.keys(monthlyData).length > 0 ? (
              <Line data={trendChartData} options={chartOptions} />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                No expenses found for the selected period
              </div>
            )}
          </div>
        </div>
      )}

      {/* Recent Transactions Table - Admin View */}
      {viewMode === "admin" && adminUserExpenses.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
            Recent User Expenses
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Description
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {adminUserExpenses.slice(0, 10).map((expense) => (
                  <tr
                    key={expense.expense_id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {expense.username}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {expense.user_email}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {format(new Date(expense.date), "MMM dd, yyyy")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
                        {expense.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                      ${expense.amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {expense.description || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
