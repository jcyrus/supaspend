"use client";

import { useState } from "react";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreateUserForm } from "./CreateUserForm";
import { UsersTable } from "./UsersTable";
import { FundUserModal } from "./FundUserModal";
import { WalletManagementModal } from "./WalletManagementModal";
import { useAdminUsers } from "@/hooks/api/useAdminUsers";
import type { UserWithBalance } from "@/types/database";

export function AdminUsersPageContent() {
  const { users, loading, error, deleteUser, refetch } = useAdminUsers();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [fundingUser, setFundingUser] = useState<UserWithBalance | null>(null);
  const [managingWalletsUser, setManagingWalletsUser] =
    useState<UserWithBalance | null>(null);

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

  const handleManageWallets = (user: UserWithBalance) => {
    setManagingWalletsUser(user);
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

  const handleWalletManagementSuccess = async () => {
    setManagingWalletsUser(null);
    await refetch(); // Refresh the users list
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">User Management</h1>
        <Button onClick={handleCreateUser}>
          <UserPlus className="h-4 w-4 mr-2" />
          Create User
        </Button>
      </div>

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
        onManageWallets={handleManageWallets}
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

      <WalletManagementModal
        open={!!managingWalletsUser}
        onOpenChange={() => setManagingWalletsUser(null)}
        user={managingWalletsUser}
        onSuccess={handleWalletManagementSuccess}
      />
    </div>
  );
}
