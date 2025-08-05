import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface UpdateExpenseData {
  amount: number;
  category: string;
  description: string | null;
  date: string;
  reason?: string | null;
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { amount, category, description, date, reason }: UpdateExpenseData =
      await req.json();
    const expenseId = params.id;

    // Use server-side auth
    const { supabase } = createClient(req);

    // Check if user is authenticated
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session?.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // First, get the current expense data to store in history
    const { data: currentExpense, error: fetchError } = await supabase
      .from("expenses")
      .select("*")
      .eq("id", expenseId)
      .eq("user_id", session.user.id) // Ensure user can only edit their own expenses
      .single();

    if (fetchError || !currentExpense) {
      return NextResponse.json(
        { error: "Expense not found or access denied" },
        { status: 404 }
      );
    }

    // Update the expense
    const { error: updateError } = await supabase
      .from("expenses")
      .update({
        amount,
        category,
        description,
        date,
        updated_at: new Date().toISOString(),
      })
      .eq("id", expenseId)
      .eq("user_id", session.user.id);

    if (updateError) {
      console.error("Error updating expense:", updateError);
      return NextResponse.json(
        { error: "Failed to update expense" },
        { status: 500 }
      );
    }

    // Create edit history record
    const { error: historyError } = await supabase
      .from("expense_edit_history")
      .insert({
        expense_id: expenseId,
        edited_by: session.user.id,
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

    return NextResponse.json({ message: "Expense updated successfully" });
  } catch (error) {
    console.error("Error in expense update API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const expenseId = params.id;

    // Use server-side auth
    const { supabase } = createClient(req);

    // Check if user is authenticated
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session?.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Delete the expense (this will also delete related edit history due to CASCADE)
    const { error } = await supabase
      .from("expenses")
      .delete()
      .eq("id", expenseId)
      .eq("user_id", session.user.id); // Ensure user can only delete their own expenses

    if (error) {
      console.error("Error deleting expense:", error);
      return NextResponse.json(
        { error: "Failed to delete expense" },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: "Expense deleted successfully" });
  } catch (error) {
    console.error("Error in expense delete API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
