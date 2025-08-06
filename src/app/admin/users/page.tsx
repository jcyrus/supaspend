"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser, getAdminUsers, checkUserRole } from "@/lib/auth-utils";
import type {
  User,
  UserRole,
  UserWithBalance,
  FundTransactionHistory,
} from "@/types/database";
import {
  Users,
  Mail,
  Calendar,
  Shield,
  Trash2,
  X,
  UserPlus,
  Wallet,
  Plus,
  DollarSign,
  TrendingUp,
  History,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function AdminUsersPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [usersWithBalances, setUsersWithBalances] = useState<UserWithBalance[]>(
    []
  );
  const [error, setError] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState("");
  const [createSuccess, setCreateSuccess] = useState("");
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    username: "",
    role: "user" as UserRole,
  });

  // Fund management state
  const [showFundModal, setShowFundModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithBalance | null>(
    null
  );
  const [fundAmount, setFundAmount] = useState("");
  const [fundDescription, setFundDescription] = useState("");
  const [fundLoading, setFundLoading] = useState(false);
  const [fundError, setFundError] = useState("");
  const [fundSuccess, setFundSuccess] = useState("");
  const [showTransactionHistory, setShowTransactionHistory] = useState(false);
  const [transactionHistory, setTransactionHistory] = useState<
    FundTransactionHistory[]
  >([]);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch users with balances
      const response = await fetch("/api/admin/users-with-balances");
      if (response.ok) {
        const responseData = await response.json();

        const { data, success } = responseData;
        const { users: usersWithBalanceData } = data || {};

        // Check if the response indicates success and has valid data
        if (success === false) {
          console.error(
            "API returned error:",
            responseData.error || "Unknown error"
          );
          throw new Error(responseData.error || "API request failed");
        }

        // Ensure usersWithBalanceData is an array before processing
        if (Array.isArray(usersWithBalanceData)) {
          setUsersWithBalances(usersWithBalanceData);

          // Convert to regular users format for compatibility with existing code
          const regularUsers = usersWithBalanceData.map(
            (user: UserWithBalance) => ({
              id: user.user_id,
              username: user.username,
              role: user.role,
              created_by: null, // This is handled by the backend function
              created_at: user.created_at,
              updated_at: user.created_at, // Not available in the new function
            })
          );
          setUsers(regularUsers);
        } else {
          console.error("Invalid users data format:", usersWithBalanceData);
          // Fall back to old method
          throw new Error("Invalid response format");
        }
      } else {
        console.error("API request failed with status:", response.status);
        const errorText = await response.text();
        console.error("Error response:", errorText);
        throw new Error(`API request failed: ${response.status}`);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      console.log("Falling back to old method...");

      try {
        // Fallback to old method if new endpoint fails
        const adminUsers = await getAdminUsers();

        if (!Array.isArray(adminUsers)) {
          throw new Error("getAdminUsers did not return an array");
        }

        setUsers(adminUsers);

        // For fallback, we don't have balance information, so set empty balances
        const fallbackUsersWithBalances = adminUsers.map((user) => ({
          user_id: user.id,
          username: user.username,
          role: user.role,
          balance: 0,
          created_at: user.created_at,
          email: user.id, // Placeholder, will be populated below
        }));
        setUsersWithBalances(fallbackUsersWithBalances);

        // Fetch email addresses for each user via API
        if (adminUsers.length > 0) {
          const userIds = adminUsers.map((user) => user.id).join(",");
          const emailResponse = await fetch(
            `/api/admin/users/emails?userIds=${userIds}`
          );

          if (emailResponse.ok) {
            const { emails } = await emailResponse.json();
            // Update usersWithBalances with actual emails
            const updatedUsersWithBalances = fallbackUsersWithBalances.map(
              (user) => ({
                ...user,
                email: emails[user.user_id] || "Loading...",
              })
            );
            setUsersWithBalances(updatedUsersWithBalances);
          } else {
            console.error("Failed to fetch user emails");
          }
        }
      } catch (fallbackError) {
        console.error("Fallback method also failed:", fallbackError);
        setError("Failed to load users. Please refresh the page.");
        setUsers([]);
        setUsersWithBalances([]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError("");
    setCreateSuccess("");
    setCreateLoading(true);

    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          username: formData.username,
          role: formData.role,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to create user");
      }

      setCreateSuccess(`User ${formData.email} created successfully!`);
      setFormData({
        email: "",
        password: "",
        username: "",
        role: "user",
      });

      // Refresh the users list
      await fetchUsers();

      // Hide the form after success
      setTimeout(() => {
        setShowCreateForm(false);
        setCreateSuccess("");
      }, 2000);
    } catch (error) {
      console.error("Error creating user:", error);
      setCreateError(
        error instanceof Error ? error.message : "Failed to create user"
      );
    } finally {
      setCreateLoading(false);
    }
  };

  const openFundModal = (user: UserWithBalance) => {
    setSelectedUser(user);
    setShowFundModal(true);
    setFundAmount("");
    setFundDescription("");
    setFundError("");
    setFundSuccess("");
  };

  const handleAddFunds = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    setFundError("");
    setFundSuccess("");
    setFundLoading(true);

    try {
      const response = await fetch("/api/admin/funds", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: selectedUser.user_id,
          amount: parseFloat(fundAmount),
          description: fundDescription,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to add funds");
      }

      setFundSuccess(
        `Successfully added $${fundAmount} to ${selectedUser.username}'s account!`
      );
      setFundAmount("");
      setFundDescription("");

      // Refresh the users list to show updated balances
      await fetchUsers();
    } catch (error) {
      console.error("Error adding funds:", error);
      setFundError(
        error instanceof Error ? error.message : "Failed to add funds"
      );
    } finally {
      setFundLoading(false);
    }
  };

  const handleViewTransactionHistory = async (user: UserWithBalance) => {
    setSelectedUser(user);
    setShowTransactionHistory(true);

    try {
      const response = await fetch(`/api/admin/funds?userId=${user.user_id}`);
      if (response.ok) {
        const { transactions } = await response.json();
        setTransactionHistory(transactions);
      } else {
        console.error("Failed to fetch transaction history");
        setTransactionHistory([]);
      }
    } catch (error) {
      console.error("Error fetching transaction history:", error);
      setTransactionHistory([]);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this user? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to delete user");
      }

      await fetchUsers();
    } catch (error) {
      console.error("Error deleting user:", error);
      setError("Failed to delete user");
    }
  };

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
    const checkAccess = async () => {
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        router.push("/auth/login");
        return;
      }

      const hasAccess = await checkUserRole("admin");
      if (!hasAccess) {
        router.push("/dashboard");
        return;
      }

      await fetchUsers();
    };

    checkAccess();
  }, [router, fetchUsers]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold">User Management</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage users, their roles, and fund balances
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(!showCreateForm)}>
          {showCreateForm ? (
            <>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </>
          ) : (
            <>
              <UserPlus className="h-4 w-4 mr-2" />
              Create User
            </>
          )}
        </Button>
      </div>

      {/* Create User Form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New User</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateUser} className="space-y-4">
              {createError && (
                <Alert variant="destructive">
                  <AlertDescription>{createError}</AlertDescription>
                </Alert>
              )}

              {createSuccess && (
                <Alert>
                  <AlertDescription>{createSuccess}</AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email address</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    name="username"
                    type="text"
                    required
                    value={formData.username}
                    onChange={(e) =>
                      setFormData({ ...formData, username: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">User Role</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        role: value as UserRole,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={createLoading}
                  variant="default"
                >
                  {createLoading ? "Creating..." : "Create User"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Users ({users.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {users.length === 0 ? (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-medium">No users found</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Get started by creating your first user.
              </p>
              <div className="mt-6">
                <Button onClick={() => setShowCreateForm(true)}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Create User
                </Button>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {usersWithBalances.map((user) => (
                  <TableRow key={user.user_id} className="hover:bg-muted/50">
                    <TableCell>
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-sm font-medium text-primary">
                              {user.username.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium">
                            {user.username}
                          </div>
                          <div className="text-sm text-muted-foreground flex items-center">
                            <Mail className="h-3 w-3 mr-1" />
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          user.role === "admin" || user.role === "superadmin"
                            ? "default"
                            : "secondary"
                        }
                        className="flex items-center w-fit"
                      >
                        <Shield className="h-3 w-3 mr-1" />
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Wallet className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span
                          className={`text-sm font-medium ${getBalanceColor(
                            user.balance
                          )}`}
                        >
                          {formatCurrency(user.balance)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-muted-foreground">
                        <Calendar className="h-3 w-3 mr-1" />
                        {new Date(user.created_at).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openFundModal(user)}
                          className="text-green-600 hover:text-green-900 hover:bg-green-50"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleViewTransactionHistory(user)}
                          className="text-blue-600 hover:text-blue-900 hover:bg-blue-50"
                        >
                          <History className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteUser(user.user_id)}
                          className="text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Fund Modal */}
      <Dialog open={showFundModal} onOpenChange={setShowFundModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Funds to {selectedUser?.username}</DialogTitle>
            <DialogDescription>
              Add funds to this user&apos;s petty cash balance.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-3 bg-muted rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Current Balance:
                </span>
                <span
                  className={`text-sm font-medium ${getBalanceColor(
                    selectedUser?.balance || 0
                  )}`}
                >
                  {formatCurrency(selectedUser?.balance || 0)}
                </span>
              </div>
            </div>

            <form onSubmit={handleAddFunds} className="space-y-4">
              {fundError && (
                <Alert variant="destructive">
                  <AlertDescription>{fundError}</AlertDescription>
                </Alert>
              )}

              {fundSuccess && (
                <Alert>
                  <AlertDescription>{fundSuccess}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="fund-amount">Amount ($)</Label>
                <Input
                  id="fund-amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={fundAmount}
                  onChange={(e) => setFundAmount(e.target.value)}
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fund-description">Description (optional)</Label>
                <Textarea
                  id="fund-description"
                  value={fundDescription}
                  onChange={(e) => setFundDescription(e.target.value)}
                  rows={3}
                  placeholder="Optional note for this deposit..."
                />
              </div>

              <div className="flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowFundModal(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={fundLoading}>
                  <DollarSign className="h-4 w-4 mr-1" />
                  {fundLoading ? "Adding..." : "Add Funds"}
                </Button>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>

      {/* Transaction History Modal */}
      <Dialog
        open={showTransactionHistory}
        onOpenChange={setShowTransactionHistory}
      >
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>
              Transaction History - {selectedUser?.username}
            </DialogTitle>
            <DialogDescription>
              View all funding transactions for this user.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-3 bg-muted rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Current Balance:
                </span>
                <span
                  className={`text-sm font-medium ${getBalanceColor(
                    selectedUser?.balance || 0
                  )}`}
                >
                  {formatCurrency(selectedUser?.balance || 0)}
                </span>
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {transactionHistory.length === 0 ? (
                <div className="text-center py-8">
                  <TrendingUp className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-2 text-sm font-medium">
                    No transactions found
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    This user hasn&apos;t had any fund transactions yet.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {transactionHistory.map((transaction) => (
                    <Card key={transaction.transaction_id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div
                              className={`p-2 rounded-full ${
                                transaction.transaction_type === "deposit"
                                  ? "bg-green-100 dark:bg-green-900"
                                  : transaction.transaction_type === "expense"
                                  ? "bg-red-100 dark:bg-red-900"
                                  : "bg-blue-100 dark:bg-blue-900"
                              }`}
                            >
                              {transaction.transaction_type === "deposit" ? (
                                <Plus className="h-4 w-4 text-green-600 dark:text-green-400" />
                              ) : transaction.transaction_type === "expense" ? (
                                <TrendingUp className="h-4 w-4 text-red-600 dark:text-red-400 transform rotate-180" />
                              ) : (
                                <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                              )}
                            </div>
                            <div>
                              <div className="text-sm font-medium capitalize">
                                {transaction.transaction_type}
                                {transaction.admin_username && (
                                  <span className="text-muted-foreground ml-2">
                                    by {transaction.admin_username}
                                  </span>
                                )}
                              </div>
                              {transaction.description && (
                                <div className="text-xs text-muted-foreground">
                                  {transaction.description}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <div
                              className={`text-sm font-medium ${
                                transaction.transaction_type === "deposit"
                                  ? "text-green-600 dark:text-green-400"
                                  : "text-red-600 dark:text-red-400"
                              }`}
                            >
                              {transaction.transaction_type === "deposit"
                                ? "+"
                                : "-"}
                              {formatCurrency(transaction.amount)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Balance: {formatCurrency(transaction.new_balance)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(
                                transaction.created_at
                              ).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <Button
                variant="outline"
                onClick={() => setShowTransactionHistory(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
