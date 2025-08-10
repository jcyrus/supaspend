"use client";

import {
  Mail,
  Calendar,
  Shield,
  Plus,
  History,
  Trash2,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TableCell, TableRow } from "@/components/ui/table";
import { formatDate } from "@/lib/utils/date";
import { CurrencyDisplay } from "@/components/shared/CurrencyComponents";
import type { UserWithBalance } from "@/types/database";

interface UserTableRowProps {
  user: UserWithBalance;
  onFund: () => void;
  onViewHistory: () => void;
  onDelete: () => void;
  onManageWallets: () => void;
}

export function UserTableRow({
  user,
  onFund,
  onViewHistory,
  onDelete,
  onManageWallets,
}: UserTableRowProps) {
  return (
    <TableRow className="hover:bg-muted/50">
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
            <div className="text-sm font-medium">{user.username}</div>
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
          <CurrencyDisplay amount={user.balance} size="sm" />
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center text-muted-foreground">
          <Calendar className="h-3 w-3 mr-1" />
          {formatDate(user.created_at)}
        </div>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={onManageWallets}
            className="text-purple-600 hover:text-purple-900 hover:bg-purple-50"
            title="Manage wallets"
          >
            <Wallet className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onFund}
            className="text-green-600 hover:text-green-900 hover:bg-green-50"
            title="Add funds"
          >
            <Plus className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onViewHistory}
            className="text-blue-600 hover:text-blue-900 hover:bg-blue-50"
            title="View transaction history"
          >
            <History className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onDelete}
            className="text-destructive hover:bg-destructive/10"
            title="Delete user"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
