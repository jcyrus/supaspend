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

  const closeFundModal = () => {
    setShowFundModal(false);
    setSelectedUser(null);
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

  const closeTransactionHistory = () => {
    setShowTransactionHistory(false);
    setSelectedUser(null);
    setTransactionHistory([]);
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

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-purple-100 text-purple-800";
      case "superadmin":
        return "bg-red-100 text-red-800";
      default:
        return "bg-blue-100 text-blue-800";
    }
  };

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
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
            User Management
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
            Manage users, their roles, and fund balances
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
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
        </button>
      </div>

      {/* Create User Form */}
      {showCreateForm && (
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
            Create New User
          </h2>

          <form onSubmit={handleCreateUser} className="space-y-4">
            {createError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {createError}
              </div>
            )}

            {createSuccess && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
                {createSuccess}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label
                  htmlFor="username"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Username
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                  className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="mt-1 appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label
                  htmlFor="role"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  User Role
                </label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      role: e.target.value as UserRole,
                    })
                  }
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={createLoading}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
              >
                {createLoading ? "Creating..." : "Create User"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Users ({users.length})
          </h2>
        </div>

        <div className="overflow-hidden">
          {users.length === 0 ? (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                No users found
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Get started by creating your first user.
              </p>
              <div className="mt-6">
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Create User
                </button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Balance
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {usersWithBalances.map((user) => (
                    <tr
                      key={user.user_id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                              <span className="text-sm font-medium text-blue-600 dark:text-blue-200">
                                {user.username.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {user.username}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                              <Mail className="h-3 w-3 mr-1" />
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(
                            user.role
                          )} dark:bg-opacity-80 dark:text-opacity-90`}
                        >
                          <Shield className="h-3 w-3 mr-1" />
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Wallet className="h-4 w-4 mr-2 text-gray-400" />
                          <span
                            className={`text-sm font-medium ${getBalanceColor(
                              user.balance
                            )}`}
                          >
                            {formatCurrency(user.balance)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          {new Date(user.created_at).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => openFundModal(user)}
                            className="text-green-600 hover:text-green-900 dark:hover:text-green-400 p-1 rounded hover:bg-green-50 dark:hover:bg-green-900/20"
                            title="Add funds"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleViewTransactionHistory(user)}
                            className="text-blue-600 hover:text-blue-900 dark:hover:text-blue-400 p-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20"
                            title="Transaction history"
                          >
                            <History className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.user_id)}
                            className="text-red-600 hover:text-red-900 dark:hover:text-red-400 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
                            title="Delete user"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Fund Modal */}
      {showFundModal && selectedUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  Add Funds to {selectedUser.username}
                </h3>
                <button
                  onClick={closeFundModal}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    Current Balance:
                  </span>
                  <span
                    className={`text-sm font-medium ${getBalanceColor(
                      selectedUser.balance
                    )}`}
                  >
                    {formatCurrency(selectedUser.balance)}
                  </span>
                </div>
              </div>

              <form onSubmit={handleAddFunds} className="space-y-4">
                {fundError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
                    {fundError}
                  </div>
                )}

                {fundSuccess && (
                  <div className="bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded text-sm">
                    {fundSuccess}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Amount ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={fundAmount}
                    onChange={(e) => setFundAmount(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description (optional)
                  </label>
                  <textarea
                    value={fundDescription}
                    onChange={(e) => setFundDescription(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                    placeholder="Optional note for this deposit..."
                  />
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={closeFundModal}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={fundLoading}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                  >
                    <div className="flex items-center">
                      <DollarSign className="h-4 w-4 mr-1" />
                      {fundLoading ? "Adding..." : "Add Funds"}
                    </div>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Transaction History Modal */}
      {showTransactionHistory && selectedUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border max-w-4xl shadow-lg rounded-md bg-white dark:bg-gray-800">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  Transaction History - {selectedUser.username}
                </h3>
                <button
                  onClick={closeTransactionHistory}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    Current Balance:
                  </span>
                  <span
                    className={`text-sm font-medium ${getBalanceColor(
                      selectedUser.balance
                    )}`}
                  >
                    {formatCurrency(selectedUser.balance)}
                  </span>
                </div>
              </div>

              <div className="max-h-96 overflow-y-auto">
                {transactionHistory.length === 0 ? (
                  <div className="text-center py-8">
                    <TrendingUp className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                      No transactions found
                    </h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      This user hasn&apos;t had any fund transactions yet.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {transactionHistory.map((transaction) => (
                      <div
                        key={transaction.transaction_id}
                        className="border border-gray-200 dark:border-gray-600 rounded-lg p-4"
                      >
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
                              <div className="text-sm font-medium text-gray-900 dark:text-gray-100 capitalize">
                                {transaction.transaction_type}
                                {transaction.admin_username && (
                                  <span className="text-gray-500 dark:text-gray-400 ml-2">
                                    by {transaction.admin_username}
                                  </span>
                                )}
                              </div>
                              {transaction.description && (
                                <div className="text-xs text-gray-500 dark:text-gray-400">
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
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              Balance: {formatCurrency(transaction.new_balance)}
                            </div>
                            <div className="text-xs text-gray-400 dark:text-gray-500">
                              {new Date(
                                transaction.created_at
                              ).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={closeTransactionHistory}
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
