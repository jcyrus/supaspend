// Shared constants across the application

export const EXPENSE_CATEGORIES = [
  "Food",
  "Transportation",
  "Office Supplies",
  "Equipment",
  "Travel",
  "Utilities",
  "Marketing",
  "Software",
  "Training",
  "Entertainment",
  "Maintenance",
  "Other",
] as const;

export const USER_ROLES = {
  USER: "user",
  ADMIN: "admin",
  SUPERADMIN: "superadmin",
} as const;

export const TRANSACTION_TYPES = {
  DEPOSIT: "deposit",
  EXPENSE: "expense",
  WITHDRAWAL: "withdrawal",
} as const;

export const TIME_PERIODS = {
  "3months": { value: "3months", label: "3 Months" },
  "6months": { value: "6months", label: "6 Months" },
  "1year": { value: "1year", label: "1 Year" },
} as const;
