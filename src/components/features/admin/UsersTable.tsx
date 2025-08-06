"use client";

import { Users, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/shared/StatusComponents";
import { UserTableRow } from "./UserTableRow";
import type { UserWithBalance } from "@/types/database";

interface UsersTableProps {
  users: UserWithBalance[];
  loading: boolean;
  onFundUser: (user: UserWithBalance) => void;
  onViewHistory: (user: UserWithBalance) => void;
  onDeleteUser: (userId: string) => void;
  onCreateUser: () => void;
}

export function UsersTable({
  users,
  loading,
  onFundUser,
  onViewHistory,
  onDeleteUser,
  onCreateUser,
}: UsersTableProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Users
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Users className="h-5 w-5 mr-2" />
          Users ({users.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="px-6">
        {users.length === 0 ? (
          <EmptyState
            icon={<Users className="h-12 w-12" />}
            title="No users found"
            description="Get started by creating your first user."
            action={
              <Button onClick={onCreateUser}>
                <UserPlus className="h-4 w-4 mr-2" />
                Create User
              </Button>
            }
          />
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
              {users.map((user) => (
                <UserTableRow
                  key={user.user_id}
                  user={user}
                  onFund={() => onFundUser(user)}
                  onViewHistory={() => onViewHistory(user)}
                  onDelete={() => onDeleteUser(user.user_id)}
                />
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
