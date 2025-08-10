// App Configuration
export const APP_CONFIG = {
  NAME: "SupaSpend",
  DESCRIPTION: "Track and manage your petty cash expenses with ease",
  VERSION: "1.0.0",
} as const;

// API Configuration
export const API_CONFIG = {
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 100,
  UPLOAD_MAX_SIZE: 5 * 1024 * 1024, // 5MB
  SUPPORTED_IMAGE_TYPES: ["image/jpeg", "image/png", "image/webp"],
} as const;

// User Roles
export const USER_ROLES = {
  USER: "user",
  ADMIN: "admin",
  SUPERADMIN: "superadmin",
} as const;

// Currencies
export const CURRENCIES = {
  USD: "USD",
  VND: "VND",
  IDR: "IDR",
  PHP: "PHP",
} as const;

export const CURRENCY_SYMBOLS = {
  USD: "$",
  VND: "₫",
  IDR: "Rp",
  PHP: "₱",
} as const;

// Transaction Types
export const TRANSACTION_TYPES = {
  FUND_IN: "fund_in",
  FUND_OUT: "fund_out",
  EXPENSE: "expense",
  DEPOSIT: "deposit",
  WITHDRAWAL: "withdrawal",
} as const;

// Expense Categories
export const EXPENSE_CATEGORY_LIST = [
  "Travel",
  "Supplies",
  "Meals",
  "Transportation",
  "Entertainment",
  "Office",
  "Marketing",
  "Utilities",
  "Other",
] as const;

// Storage Buckets
export const STORAGE_BUCKETS = {
  AVATARS: "avatars",
} as const;

// Date Formats
export const DATE_FORMATS = {
  ISO: "YYYY-MM-DD",
  DISPLAY: "MMM DD, YYYY",
  DATETIME: "MMM DD, YYYY HH:mm",
} as const;
