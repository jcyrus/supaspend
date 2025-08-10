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
import { useWallets, useWalletBalances } from "@/hooks/api/useWallets";
import {
  formatCurrencyWithSymbol,
  getBalanceColor,
} from "@/lib/utils/currency";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type {
  Expense,
  AdminUserExpense,
  User as UserType,
} from "@/types/database";
import {
  getAdminUserExpenses,
  checkUserRole,
  getCurrentUser,
} from "@/lib/auth-utils";

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
  const [selectedWalletId, setSelectedWalletId] = useState<string>("all");
  const [currentUser, setCurrentUser] = useState<{
    id: string;
    email?: string;
    profile: UserType;
  } | null>(null);
  const [userBalances, setUserBalances] = useState<{ [key: string]: number }>(
    {}
  );

  // Load wallets for current user
  const { wallets } = useWallets(currentUser?.id);
  const { balances } = useWalletBalances(wallets);

  // Calculate total balance across all wallets
  const totalBalance = Object.values(balances).reduce(
    (sum, balance) => sum + balance,
    0
  );
  const selectedWallet = wallets.find((w) => w.id === selectedWalletId);
  const selectedWalletBalance =
    selectedWalletId === "all" ? totalBalance : balances[selectedWalletId] || 0;

  const checkAdminStatus = useCallback(async () => {
    const hasAdminAccess = await checkUserRole("admin");
    setIsAdmin(hasAdminAccess);
  }, []);

  const fetchPersonalExpenses = useCallback(async () => {
    try {
      const user = await getCurrentUser();
      setCurrentUser(user);

      if (!user) return;

      const monthsBack =
        selectedPeriod === "3months"
          ? 3
          : selectedPeriod === "6months"
          ? 6
          : 12;
      const startDate = subMonths(new Date(), monthsBack);

      let query = supabase
        .from("expenses")
        .select(
          `
          *,
          wallet:wallets(id, currency, name)
        `
        )
        .eq("user_id", user.id)
        .gte("date", format(startDate, "yyyy-MM-dd"))
        .order("date", { ascending: true });

      // Apply wallet filter
      if (selectedWalletId !== "all") {
        query = query.eq("wallet_id", selectedWalletId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setExpenses(data || []);
    } catch (error) {
      console.error("Error fetching personal expenses:", error);
    }
  }, [supabase, selectedPeriod, selectedWalletId]);

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
      await fetchPersonalExpenses();
    } else if (viewMode === "admin") {
      await Promise.all([fetchAdminExpenses(), fetchUserBalances()]);
    }

    setLoading(false);
  }, [
    viewMode,
    checkAdminStatus,
    fetchPersonalExpenses,
    fetchAdminExpenses,
    fetchUserBalances,
  ]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  // Refetch data when period changes
  useEffect(() => {
    setLoading(true);
    if (viewMode === "personal") {
      fetchPersonalExpenses().finally(() => setLoading(false));
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
    fetchUserBalances,
  ]);

  // Get the data based on view mode
  const currentExpenses =
    viewMode === "personal"
      ? expenses
      : (adminUserExpenses || []).map((e) => ({
          id: e.expense_id,
          user_id: e.user_id,
          wallet_id: "", // Admin expenses don't have wallet_id in this format
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
      <div className="max-w-7xl mx-auto py-6">
        <div className="space-y-6">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="h-4 bg-muted rounded w-1/2 mb-2"></div>
                    <div className="h-8 bg-muted rounded w-3/4"></div>
                  </CardContent>
                </Card>
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
          <h1 className="text-3xl font-bold">
            {viewMode === "admin" ? "Admin Reports" : "Expense Reports"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {viewMode === "admin"
              ? "View expense reports for users you manage"
              : "Analyze your spending patterns and trends"}
          </p>
        </div>
        <div className="flex items-center space-x-4">
          {isAdmin && (
            <div className="flex">
              <Button
                onClick={() => setViewMode("personal")}
                variant={viewMode === "personal" ? "default" : "outline"}
                size="sm"
                className="rounded-r-none"
              >
                <User className="h-4 w-4 mr-1" />
                Personal
              </Button>
              <Button
                onClick={() => setViewMode("admin")}
                variant={viewMode === "admin" ? "default" : "outline"}
                size="sm"
                className="rounded-l-none"
              >
                <Users className="h-4 w-4 mr-1" />
                Admin View
              </Button>
            </div>
          )}
          <Button
            onClick={downloadReport}
            className="bg-green-500 hover:bg-green-600 cursor-pointer"
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm font-medium">Time Period:</span>
            </div>
            <div className="flex space-x-2">
              {[
                { value: "3months" as const, label: "3 Months" },
                { value: "6months" as const, label: "6 Months" },
                { value: "1year" as const, label: "1 Year" },
              ].map((period) => (
                <Button
                  key={period.value}
                  onClick={() => setSelectedPeriod(period.value)}
                  variant={
                    selectedPeriod === period.value ? "default" : "outline"
                  }
                  size="sm"
                >
                  {period.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Wallet Filter for Personal View */}
          {viewMode === "personal" && wallets.length > 0 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <div className="flex items-center space-x-2">
                <Wallet className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm font-medium">Wallet Filter:</span>
              </div>
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
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {/* Balance Card - Personal View */}
        {viewMode === "personal" && (
          <Card>
            <CardContent className="px-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Wallet className="h-8 w-8 text-indigo-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">
                    {selectedWalletId === "all"
                      ? "Total Balance"
                      : `${selectedWallet?.name || "Wallet"} Balance`}
                  </p>
                  <div
                    className={`text-2xl font-semibold ${getBalanceColor(
                      selectedWalletBalance
                    )}`}
                  >
                    {Object.keys(balances).length === 0 ? (
                      <div className="animate-pulse h-8 bg-muted rounded w-20"></div>
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
            </CardContent>
          </Card>
        )}

        {/* Total Balance Card - Admin View */}
        {viewMode === "admin" && (
          <Card>
            <CardContent className="px-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Wallet className="h-8 w-8 text-indigo-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">
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
                    {formatCurrencyWithSymbol(
                      Object.values(userBalances).reduce(
                        (sum, bal) => sum + bal,
                        0
                      ),
                      "USD"
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="px-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">
                  Total Expenses
                </p>
                <p className="text-2xl font-semibold">
                  {viewMode === "personal" &&
                  selectedWalletId !== "all" &&
                  selectedWallet
                    ? formatCurrencyWithSymbol(
                        totalAmount,
                        selectedWallet.currency
                      )
                    : formatCurrencyWithSymbol(totalAmount, "USD")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="px-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Calendar className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">
                  {viewMode === "admin" ? "Users Tracked" : "Transactions"}
                </p>
                <p className="text-2xl font-semibold">
                  {viewMode === "admin"
                    ? new Set((adminUserExpenses || []).map((e) => e.user_id))
                        .size
                    : currentExpenses.length}
                </p>
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
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">
                  Average per Month
                </p>
                <p className="text-2xl font-semibold">
                  {(() => {
                    const avgAmount =
                      Object.keys(monthlyData).length > 0
                        ? totalAmount / Object.keys(monthlyData).length
                        : 0;
                    return viewMode === "personal" &&
                      selectedWalletId !== "all" &&
                      selectedWallet
                      ? formatCurrencyWithSymbol(
                          avgAmount,
                          selectedWallet.currency
                        )
                      : formatCurrencyWithSymbol(avgAmount, "USD");
                  })()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Expenses by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {Object.keys(categoryData).length > 0 ? (
                <Doughnut data={categoryChartData} options={chartOptions} />
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  {viewMode === "admin"
                    ? "No user expenses found for the selected period"
                    : "No expenses found for the selected period"}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Monthly Spending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {Object.keys(monthlyData).length > 0 ? (
                <Bar data={monthlyChartData} options={chartOptions} />
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  {viewMode === "admin"
                    ? "No user expenses found for the selected period"
                    : "No expenses found for the selected period"}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trend Chart or User Summary */}
      {viewMode === "admin" ? (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>User Summary</CardTitle>
          </CardHeader>
          <CardContent>
            {adminUserExpenses.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Balance</TableHead>
                      <TableHead>Total Expenses</TableHead>
                      <TableHead>Transactions</TableHead>
                      <TableHead>Average per Month</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
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
                          <TableRow key={userId}>
                            <TableCell>
                              <div>
                                <div className="text-sm font-medium">
                                  {summary.username}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {summary.email}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <span
                                className={`text-sm font-medium ${getBalanceColor(
                                  userBalances[userId] || 0
                                )}`}
                              >
                                {formatCurrencyWithSymbol(
                                  userBalances[userId] || 0,
                                  "USD"
                                )}
                                {(userBalances[userId] || 0) < 0 && (
                                  <div className="flex items-center text-xs text-red-600 dark:text-red-400 mt-1">
                                    <AlertTriangle className="h-3 w-3 mr-1" />
                                    Negative
                                  </div>
                                )}
                              </span>
                            </TableCell>
                            <TableCell className="text-sm font-medium">
                              {formatCurrencyWithSymbol(
                                summary.totalAmount,
                                "USD"
                              )}
                            </TableCell>
                            <TableCell className="text-sm">
                              {summary.transactionCount}
                            </TableCell>
                            <TableCell className="text-sm">
                              {formatCurrencyWithSymbol(
                                Object.keys(summary.monthlyData).length > 0
                                  ? summary.totalAmount /
                                      Object.keys(summary.monthlyData).length
                                  : 0,
                                "USD"
                              )}
                            </TableCell>
                          </TableRow>
                        )
                      );
                    })()}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="flex items-center justify-center h-32 text-muted-foreground">
                No user expenses found for the selected period
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Spending Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {Object.keys(monthlyData).length > 0 ? (
                <Line data={trendChartData} options={chartOptions} />
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No expenses found for the selected period
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Transactions Table - Admin View */}
      {viewMode === "admin" && adminUserExpenses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent User Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Description</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {adminUserExpenses.slice(0, 10).map((expense) => (
                    <TableRow key={expense.expense_id}>
                      <TableCell>
                        <div>
                          <div className="text-sm font-medium">
                            {expense.username}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {expense.user_email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {format(new Date(expense.date), "MMM dd, yyyy")}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{expense.category}</Badge>
                      </TableCell>
                      <TableCell className="text-sm font-medium">
                        {formatCurrencyWithSymbol(expense.amount, "USD")}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {expense.description || "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
