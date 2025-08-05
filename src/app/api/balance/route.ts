import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    // Use server-side auth
    const { supabase } = createServerClient(request);

    // Check if user is authenticated
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session?.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Get user balance
    const { data: balance, error: balanceError } = await supabase.rpc(
      "get_user_balance",
      {
        target_user_id: session.user.id,
      }
    );

    if (balanceError) {
      console.error("Error getting balance:", balanceError);
      return NextResponse.json(
        { error: balanceError.message },
        { status: 400 }
      );
    }

    // Get recent transaction history
    const { data: transactions, error: transactionsError } = await supabase.rpc(
      "get_user_fund_transactions",
      {
        target_user_id: session.user.id,
        limit_count: 10,
      }
    );

    if (transactionsError) {
      console.error("Error getting transactions:", transactionsError);
      return NextResponse.json(
        { error: transactionsError.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      balance: balance || 0,
      transactions: transactions || [],
    });
  } catch (error) {
    console.error("Error getting user balance:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
