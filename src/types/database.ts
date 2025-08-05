export type UserRole = "user" | "admin" | "superadmin";
export type TransactionType = "deposit" | "withdrawal" | "expense";

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          username: string;
          role: UserRole;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          username: string;
          role?: UserRole;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          role?: UserRole;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      expenses: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          amount: number;
          category: string;
          description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          date: string;
          amount: number;
          category: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          date?: string;
          amount?: number;
          category?: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_balances: {
        Row: {
          id: string;
          user_id: string;
          balance: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          balance?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          balance?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      fund_transactions: {
        Row: {
          id: string;
          user_id: string;
          admin_id: string | null;
          transaction_type: TransactionType;
          amount: number;
          previous_balance: number;
          new_balance: number;
          description: string | null;
          expense_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          admin_id?: string | null;
          transaction_type: TransactionType;
          amount: number;
          previous_balance: number;
          new_balance: number;
          description?: string | null;
          expense_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          admin_id?: string | null;
          transaction_type?: TransactionType;
          amount?: number;
          previous_balance?: number;
          new_balance?: number;
          description?: string | null;
          expense_id?: string | null;
          created_at?: string;
        };
      };
    };
  };
}

export type User = Database["public"]["Tables"]["users"]["Row"];
export type Expense = Database["public"]["Tables"]["expenses"]["Row"];
export type ExpenseInsert = Database["public"]["Tables"]["expenses"]["Insert"];
export type ExpenseUpdate = Database["public"]["Tables"]["expenses"]["Update"];
export type UserBalance = Database["public"]["Tables"]["user_balances"]["Row"];
export type FundTransaction =
  Database["public"]["Tables"]["fund_transactions"]["Row"];

export interface AdminUserExpense {
  expense_id: string;
  user_id: string;
  username: string;
  user_email: string;
  date: string;
  amount: number;
  category: string;
  description: string | null;
  created_at: string;
}

export interface UserWithBalance {
  user_id: string;
  username: string;
  role: UserRole;
  balance: number;
  created_at: string;
  email: string;
}

export interface FundTransactionHistory {
  transaction_id: string;
  transaction_type: TransactionType;
  amount: number;
  previous_balance: number;
  new_balance: number;
  description: string | null;
  admin_username: string | null;
  created_at: string;
}

export const EXPENSE_CATEGORIES = [
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

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];
