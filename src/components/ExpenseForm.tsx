"use client";

import { createClient } from "@/lib/supabase/client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Save, ArrowLeft, Wallet, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { EXPENSE_CATEGORIES } from "@/types/database";
import type { ExpenseInsert } from "@/types/database";

export default function ExpenseForm() {
  const supabase = createClient();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState<number>(0);
  const [balanceLoading, setBalanceLoading] = useState(true);
  const [formData, setFormData] = useState({
    date: format(new Date(), "yyyy-MM-dd"),
    amount: "",
    category: "",
    description: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("Not authenticated");
      }

      const expenseAmount = parseFloat(formData.amount);

      // Check if the expense would result in a negative balance beyond a reasonable limit
      // (We allow negative balances, but warn the user)
      const newBalance = balance - expenseAmount;
      const showWarning = newBalance < -1000; // Warn if balance would go below -$1000

      if (showWarning) {
        const confirmed = confirm(
          `This expense will bring your balance to ${formatCurrency(
            newBalance
          )}. ` +
            "Your balance will go significantly negative. Do you want to continue?"
        );
        if (!confirmed) {
          setLoading(false);
          return;
        }
      }

      const expenseData: ExpenseInsert = {
        user_id: user.id,
        date: formData.date,
        amount: expenseAmount,
        category: formData.category,
        description: formData.description || null,
      };

      const { error } = await supabase.from("expenses").insert([expenseData]);

      if (error) throw error;

      router.push("/dashboard");
    } catch (error) {
      console.error("Error creating expense:", error);
      alert("Failed to create expense. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fetchUserBalance = async () => {
    try {
      setBalanceLoading(true);
      const response = await fetch("/api/balance");
      if (response.ok) {
        const { balance: userBalance } = await response.json();
        setBalance(userBalance);
      } else {
        console.error("Failed to fetch balance");
        setBalance(0);
      }
    } catch (error) {
      console.error("Error fetching balance:", error);
      setBalance(0);
    } finally {
      setBalanceLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const getBalanceColor = (balance: number) => {
    if (balance < 0) return "text-red-600 dark:text-red-400";
    if (balance === 0) return "text-gray-600 dark:text-gray-400";
    return "text-green-600 dark:text-green-400";
  };

  const getNewBalancePreview = () => {
    const amount = parseFloat(formData.amount) || 0;
    return balance - amount;
  };

  useEffect(() => {
    fetchUserBalance();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="max-w-2xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-4 mb-4">
          <Link
            href="/dashboard"
            className="flex items-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-1" />
            Back to Dashboard
          </Link>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Add New Expense
        </h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
          Record a new expense in your petty cash tracker
        </p>
      </div>

      {/* Balance Card */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-full">
              <Wallet className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                Available Balance
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Your current petty cash balance
              </p>
            </div>
          </div>
          <div className="text-right">
            {balanceLoading ? (
              <div className="animate-pulse">
                <div className="h-8 w-24 bg-gray-200 dark:bg-gray-600 rounded"></div>
              </div>
            ) : (
              <>
                <div
                  className={`text-2xl font-bold ${getBalanceColor(balance)}`}
                >
                  {formatCurrency(balance)}
                </div>
                {balance < 0 && (
                  <div className="flex items-center text-sm text-red-600 dark:text-red-400 mt-1">
                    <AlertTriangle className="h-4 w-4 mr-1" />
                    Negative Balance
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Balance Preview */}
        {formData.amount && !isNaN(parseFloat(formData.amount)) && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-300">
                Balance after expense:
              </span>
              <span
                className={`font-medium ${getBalanceColor(
                  getNewBalancePreview()
                )}`}
              >
                {formatCurrency(getNewBalancePreview())}
              </span>
            </div>
            {getNewBalancePreview() < -500 && (
              <div className="flex items-center text-sm text-amber-600 dark:text-amber-400 mt-2">
                <AlertTriangle className="h-4 w-4 mr-1" />
                This will result in a significant negative balance
              </div>
            )}
          </div>
        )}
      </div>

      {/* Form */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
        <form onSubmit={handleSubmit} className="space-y-6 p-6">
          {/* Date */}
          <div>
            <label
              htmlFor="date"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Date *
            </label>
            <input
              type="date"
              id="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              required
              className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:[color-scheme:dark]"
            />
          </div>

          {/* Amount */}
          <div>
            <label
              htmlFor="amount"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Amount ($) *
            </label>
            <input
              type="number"
              id="amount"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              step="0.01"
              min="0"
              required
              placeholder="0.00"
              className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>

          {/* Category */}
          <div>
            <label
              htmlFor="category"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Category *
            </label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
              className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="">Select a category</option>
              {EXPENSE_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              placeholder="Optional description of the expense"
              className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-3">
            <Link
              href="/dashboard"
              className="bg-white dark:bg-gray-700 py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Expense
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Tips */}
      <div className="mt-6 bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
          Tips for recording expenses:
        </h3>
        <ul className="text-sm text-blue-700 dark:text-blue-200 space-y-1">
          <li>• Be specific in your descriptions to make tracking easier</li>
          <li>• Choose the most appropriate category for better reporting</li>
          <li>
            • Record expenses as soon as possible to avoid forgetting details
          </li>
          <li>• Keep receipts for verification and tax purposes</li>
        </ul>
      </div>
    </div>
  );
}
