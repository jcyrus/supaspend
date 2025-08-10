"use client";

import { ReactNode } from "react";
import { formatCurrency, getBalanceColor } from "@/lib/utils/currency";
import { Card, CardContent } from "@/components/ui/card";

interface CurrencyDisplayProps {
  amount: number;
  size?: "sm" | "md" | "lg";
  showColor?: boolean;
  className?: string;
}

export function CurrencyDisplay({
  amount,
  size = "md",
  showColor = true,
  className = "",
}: CurrencyDisplayProps) {
  const sizeClasses = {
    sm: "text-sm",
    md: "text-lg",
    lg: "text-2xl",
  };

  const colorClass = showColor ? getBalanceColor(amount) : "";

  return (
    <span
      className={`font-semibold ${sizeClasses[size]} ${colorClass} ${className}`}
    >
      {formatCurrency(amount)}
    </span>
  );
}

interface BalanceCardProps {
  title: string;
  amount: number;
  description?: string;
  icon?: ReactNode;
  loading?: boolean;
  className?: string;
}

export function BalanceCard({
  title,
  amount,
  description,
  icon,
  loading = false,
  className = "",
}: BalanceCardProps) {
  return (
    <Card className={className}>
      <CardContent className="px-6">
        <div className="flex items-center">
          {icon && <div className="flex-shrink-0 mr-4">{icon}</div>}
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            {loading ? (
              <div className="animate-pulse h-8 w-24 bg-muted rounded mt-1"></div>
            ) : (
              <>
                <CurrencyDisplay amount={amount} size="lg" />
                {description && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {description}
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
