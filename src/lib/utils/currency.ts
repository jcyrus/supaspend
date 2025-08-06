/**
 * Currency formatting and balance color utilities
 */

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

export function getBalanceColor(balance: number): string {
  if (balance < 0) return "text-destructive";
  if (balance === 0) return "text-muted-foreground";
  return "text-green-600 dark:text-green-400";
}

export function getTransactionTypeColor(type: string): string {
  switch (type?.toLowerCase()) {
    case "deposit":
      return "text-green-600 dark:text-green-400";
    case "withdrawal":
      return "text-destructive";
    case "expense":
      return "text-orange-600 dark:text-orange-400";
    default:
      return "text-muted-foreground";
  }
}

/**
 * Format balance with proper color styling
 */
export function formatBalanceWithColor(balance: number): {
  formatted: string;
  colorClass: string;
} {
  return {
    formatted: formatCurrency(balance),
    colorClass: getBalanceColor(balance),
  };
}
