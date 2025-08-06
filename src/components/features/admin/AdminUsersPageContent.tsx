"use client";

import { useState } from "react";
import { CreateUserForm } from "./CreateUserForm";
import { UsersTable } from "./UsersTable";
import { FundUserModal } from "./FundUserModal";
import { AdminBalanceCard } from "./AdminBalanceCard";
import { SelfFundModal } from "./SelfFundModal";
import { useAdminUsers } from "@/hooks/api/useAdminUsers";
import { useCurrentAdmin } from "@/hooks/api/useCurrentAdmin";
import type { UserWithBalance } from "@/types/database";

export function AdminUsersPageContent() {
  const { users, loading, error, deleteUser, refetch } = useAdminUsers();
  const {
    currentAdmin,
    loading: adminLoading,
    error: adminError,
    fundSelf,
    refetch: refetchAdmin,
  } = useCurrentAdmin();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [fundingUser, setFundingUser] = useState<UserWithBalance | null>(null);
  const [selfFundModalOpen, setSelfFundModalOpen] = useState(false);

  const handleDeleteUser = async (userId: string) => {
    const user = users.find((u) => u.user_id === userId);
    if (!user) return;

    if (
      window.confirm(`Are you sure you want to delete user "${user.username}"?`)
    ) {
      try {
        await deleteUser(userId);
      } catch (error) {
        console.error("Failed to delete user:", error);
      }
    }
  };

  const handleFundUser = (user: UserWithBalance) => {
    setFundingUser(user);
  };

  const handleViewHistory = (user: UserWithBalance) => {
    // TODO: Implement view history functionality
    console.log("View history for user:", user.username);
  };

  const handleCreateUser = () => {
    setShowCreateForm(true);
  };

  const handleCreateSuccess = async () => {
    setShowCreateForm(false);
    await refetch();
  };

  const handleCreateCancel = () => {
    setShowCreateForm(false);
  };

  const handleFundSuccess = async () => {
    setFundingUser(null);
    await refetch(); // Refresh the users list
  };

  const handleSelfFund = async (amount: number, description?: string) => {
    try {
      await fundSelf(amount, description);
      // Refresh both admin info and users list (in case admin appears in users list)
      await Promise.all([refetchAdmin(), refetch()]);
    } catch (error) {
      throw error; // Re-throw to be handled by the modal
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">User Management</h1>

      {/* Admin Balance Card */}
      {currentAdmin && (
        <AdminBalanceCard
          balance={currentAdmin.balance}
          username={currentAdmin.username}
          loading={adminLoading}
          onTopUp={() => setSelfFundModalOpen(true)}
          onRefresh={refetchAdmin}
        />
      )}

      {adminError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">
          Error loading admin info: {adminError}
        </div>
      )}

      {/* Create User Form */}
      {showCreateForm && (
        <CreateUserForm
          onSuccess={handleCreateSuccess}
          onCancel={handleCreateCancel}
        />
      )}

      <UsersTable
        users={users}
        loading={loading}
        onDeleteUser={handleDeleteUser}
        onFundUser={handleFundUser}
        onViewHistory={handleViewHistory}
        onCreateUser={handleCreateUser}
      />

      {/* Display error if any */}
      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md">
          Error: {error}
        </div>
      )}

      <FundUserModal
        open={!!fundingUser}
        onOpenChange={() => setFundingUser(null)}
        user={fundingUser}
        onSuccess={handleFundSuccess}
      />

      {currentAdmin && (
        <SelfFundModal
          open={selfFundModalOpen}
          onOpenChange={setSelfFundModalOpen}
          onConfirm={handleSelfFund}
          currentBalance={currentAdmin.balance}
          username={currentAdmin.username}
        />
      )}
    </div>
  );
}
