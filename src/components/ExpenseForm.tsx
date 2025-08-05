"use client";

import { createClient } from "@/lib/supabase/client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Save, ArrowLeft, Wallet, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { EXPENSE_CATEGORIES } from "@/types/database";
import type { ExpenseInsert } from "@/types/database";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
    if (balance < 0) return "text-destructive";
    if (balance === 0) return "text-muted-foreground";
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
          <Button variant="ghost" asChild>
            <Link href="/dashboard" className="flex items-center">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
        </div>
        <h1 className="text-3xl font-bold">Add New Expense</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Record a new expense in your petty cash tracker
        </p>
      </div>

      {/* Balance Card */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-primary/10 rounded-full">
                <Wallet className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-medium">Available Balance</h3>
                <p className="text-sm text-muted-foreground">
                  Your current petty cash balance
                </p>
              </div>
            </div>
            <div className="text-right">
              {balanceLoading ? (
                <div className="animate-pulse">
                  <div className="h-8 w-24 bg-muted rounded"></div>
                </div>
              ) : (
                <>
                  <div
                    className={`text-2xl font-bold ${getBalanceColor(balance)}`}
                  >
                    {formatCurrency(balance)}
                  </div>
                  {balance < 0 && (
                    <div className="flex items-center text-sm text-destructive mt-1">
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
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
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
        </CardContent>
      </Card>

      {/* Form */}
      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Date */}
            <div className="space-y-2">
              <Label htmlFor="date">Date *</Label>
              <Input
                type="date"
                id="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
              />
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <Label htmlFor="amount">Amount ($) *</Label>
              <Input
                type="number"
                id="amount"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                step="0.01"
                min="0"
                required
                placeholder="0.00"
              />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select
                name="category"
                value={formData.category}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, category: value }))
                }
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {EXPENSE_CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                placeholder="Optional description of the expense"
              />
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-3">
              <Button variant="outline" asChild>
                <Link href="/dashboard">Cancel</Link>
              </Button>
              <Button type="submit" disabled={loading}>
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
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Tips */}
      <Card className="mt-6 bg-primary/5 border-primary/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-primary">
            Tips for recording expenses:
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Be specific in your descriptions to make tracking easier</li>
            <li>• Choose the most appropriate category for better reporting</li>
            <li>
              • Record expenses as soon as possible to avoid forgetting details
            </li>
            <li>• Keep receipts for verification and tax purposes</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
