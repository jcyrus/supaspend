"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Wallet, RefreshCcw } from "lucide-react";
import { formatCurrency, getBalanceColor } from "@/lib/utils/currency";

interface AdminBalanceCardProps {
  balance: number;
  username: string;
  loading: boolean;
  onTopUp: () => void;
  onRefresh: () => void;
}

export function AdminBalanceCard({
  balance,
  username,
  loading,
  onTopUp,
  onRefresh,
}: AdminBalanceCardProps) {
  const balanceColor = getBalanceColor(balance);

  return (
    <Card className="mb-6">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-medium">
          Your Admin Balance
        </CardTitle>
        <Wallet className="h-5 w-5 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-2xl font-bold">
              <span className={balanceColor}>{formatCurrency(balance)}</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Logged in as: {username}
            </p>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={loading}
            >
              <RefreshCcw
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
            </Button>
            <Button onClick={onTopUp} disabled={loading} size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Top Up
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
