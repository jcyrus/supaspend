/**
 * Currency formatting and balance color utilities
 */

import type { Currency } from "@/types/database";

export const SUPPORTED_CURRENCIES = ["USD", "VND", "IDR", "PHP"] as const;

export const CURRENCY_CONFIG = {
  USD: {
    symbol: "$",
    name: "US Dollar",
    decimals: 2,
    locale: "en-US",
  },
  VND: {
    symbol: "₫",
    name: "Vietnamese Dong",
    decimals: 0,
    locale: "vi-VN",
  },
  IDR: {
    symbol: "Rp",
    name: "Indonesian Rupiah",
    decimals: 0,
    locale: "id-ID",
  },
  PHP: {
    symbol: "₱",
    name: "Philippine Peso",
    decimals: 2,
    locale: "en-PH",
  },
} as const;

export function formatCurrencyWithSymbol(
  amount: number,
  currency: Currency
): string {
  const config = CURRENCY_CONFIG[currency];

  if (currency === "VND" || currency === "IDR") {
    // For VND and IDR, show symbol + formatted number without decimals
    return `${config.symbol}${amount.toLocaleString(config.locale, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;
  }

  // For USD and PHP, use standard currency formatting
  return new Intl.NumberFormat(config.locale, {
    style: "currency",
    currency: currency,
    minimumFractionDigits: config.decimals,
    maximumFractionDigits: config.decimals,
  }).format(amount);
}

// Enhanced formatCurrency with optional currency parameter
export function formatCurrency(
  amount: number,
  currency: Currency = "USD"
): string {
  return formatCurrencyWithSymbol(amount, currency);
}

// Legacy function for backward compatibility (defaults to USD)
export function formatCurrencyLegacy(amount: number): string {
  return formatCurrency(amount, "USD");
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
