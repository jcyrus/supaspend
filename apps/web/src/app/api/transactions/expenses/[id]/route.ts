import { NextRequest } from "next/server";
import { withAuth, errorResponse, successResponse } from "@/lib/api-middleware";

interface UpdateExpenseData {
  amount: number;
  category: string;
  description: string | null;
  date: string;
  reason?: string | null;
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Use middleware for authentication
  const authResult = await withAuth(req);

  if (!authResult.success) {
    return authResult.response!;
  }

  try {
    const { amount, category, description, date, reason }: UpdateExpenseData =
      await req.json();
    const resolvedParams = await params;
    const expenseId = resolvedParams.id;
    const { supabase, user } = authResult;

    // First, get the current expense data to store in history
    const { data: currentExpense, error: fetchError } = await supabase!
      .from("expenses")
      .select("*")
      .eq("id", expenseId)
      .eq("user_id", user!.id) // Ensure user can only edit their own expenses
      .single();

    if (fetchError || !currentExpense) {
      return errorResponse("Expense not found or access denied", 404);
    }

    // Update the expense
    const { error: updateError } = await supabase!
      .from("expenses")
      .update({
        amount,
        category,
        description,
        date,
        updated_at: new Date().toISOString(),
      })
      .eq("id", expenseId)
      .eq("user_id", user!.id);

    if (updateError) {
      console.error("Error updating expense:", updateError);
      return errorResponse("Failed to update expense", 500);
    }

    // Create edit history record
    const { error: historyError } = await supabase!
      .from("expense_edit_history")
      .insert({
        expense_id: expenseId,
        edited_by: user!.id,
        previous_data: {
          amount: currentExpense.amount,
          category: currentExpense.category,
          description: currentExpense.description,
          date: currentExpense.date,
        },
        new_data: {
          amount,
          category,
          description,
          date,
        },
        reason,
      });

    if (historyError) {
      console.error("Error creating edit history:", historyError);
      // Don't fail the request if history creation fails, just log it
    }

    return successResponse({ message: "Expense updated successfully" });
  } catch (error) {
    console.error("Error in expense update API:", error);
    return errorResponse("Internal server error", 500);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Use middleware for authentication
  const authResult = await withAuth(req);

  if (!authResult.success) {
    return authResult.response!;
  }

  try {
    const resolvedParams = await params;
    const expenseId = resolvedParams.id;
    const { supabase, user } = authResult;

    // Delete the expense (this will also delete related edit history due to CASCADE)
    const { error } = await supabase!
      .from("expenses")
      .delete()
      .eq("id", expenseId)
      .eq("user_id", user!.id); // Ensure user can only delete their own expenses

    if (error) {
      console.error("Error deleting expense:", error);
      return errorResponse("Failed to delete expense", 500);
    }

    return successResponse({ message: "Expense deleted successfully" });
  } catch (error) {
    console.error("Error in expense delete API:", error);
    return errorResponse("Internal server error", 500);
  }
}
