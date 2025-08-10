import { z } from "zod";
import { UserRole, EXPENSE_CATEGORIES } from "./database";

// Generic API Response Types
export interface ApiResponse<T = unknown> {
  data: T;
  success: boolean;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ErrorResponse {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
}

// Auth Types
export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

// User DTOs
export const CreateUserSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(20),
  display_name: z.string().optional(),
  role: z.enum(["user", "admin", "superadmin"]).default("user"),
  password: z.string().min(8),
});

export const UpdateUserSchema = z.object({
  username: z.string().min(3).max(20).optional(),
  display_name: z.string().optional(),
  role: z.enum(["user", "admin", "superadmin"]).optional(),
});

export const UpdateProfileSchema = z.object({
  username: z.string().min(3).max(20).optional(),
  display_name: z.string().optional(),
});

export type CreateUserDto = z.infer<typeof CreateUserSchema>;
export type UpdateUserDto = z.infer<typeof UpdateUserSchema>;
export type UpdateProfileDto = z.infer<typeof UpdateProfileSchema>;

// Wallet DTOs
export const CreateWalletSchema = z.object({
  name: z.string().min(1).max(50),
  currency: z.enum(["USD", "VND", "IDR", "PHP"]),
  is_default: z.boolean().default(false),
});

export const UpdateWalletSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  currency: z.enum(["USD", "VND", "IDR", "PHP"]).optional(),
  is_default: z.boolean().optional(),
});

export type CreateWalletDto = z.infer<typeof CreateWalletSchema>;
export type UpdateWalletDto = z.infer<typeof UpdateWalletSchema>;

// Expense DTOs
export const CreateExpenseSchema = z.object({
  wallet_id: z.string().uuid(),
  amount: z.number().positive(),
  category: z.enum(EXPENSE_CATEGORIES),
  description: z.string().optional(),
  date: z.string().datetime(),
});

export const UpdateExpenseSchema = z.object({
  wallet_id: z.string().uuid().optional(),
  amount: z.number().positive().optional(),
  category: z.enum(EXPENSE_CATEGORIES).optional(),
  description: z.string().optional(),
  date: z.string().datetime().optional(),
});

export type CreateExpenseDto = z.infer<typeof CreateExpenseSchema>;
export type UpdateExpenseDto = z.infer<typeof UpdateExpenseSchema>;

// Fund Transaction DTOs
export const FundUserSchema = z.object({
  user_id: z.string().uuid(),
  wallet_id: z.string().uuid(),
  amount: z.number().positive(),
  description: z.string().optional(),
});

export type FundUserDto = z.infer<typeof FundUserSchema>;

// Query Parameters
export const PaginationSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10),
});

export const ExpenseFiltersSchema = z
  .object({
    category: z.enum(EXPENSE_CATEGORIES).optional(),
    wallet_id: z.string().uuid().optional(),
    date_from: z.string().datetime().optional(),
    date_to: z.string().datetime().optional(),
  })
  .merge(PaginationSchema);

export const TransactionFiltersSchema = z
  .object({
    transaction_type: z
      .enum(["fund_in", "fund_out", "expense", "deposit", "withdrawal"])
      .optional(),
    user_id: z.string().uuid().optional(),
    wallet_id: z.string().uuid().optional(),
    date_from: z.string().datetime().optional(),
    date_to: z.string().datetime().optional(),
  })
  .merge(PaginationSchema);

export type PaginationQuery = z.infer<typeof PaginationSchema>;
export type ExpenseFiltersQuery = z.infer<typeof ExpenseFiltersSchema>;
export type TransactionFiltersQuery = z.infer<typeof TransactionFiltersSchema>;
