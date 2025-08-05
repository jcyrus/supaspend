import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
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

    // Get user profile to check role
    const { data: userProfile, error: userProfileError } = await supabase
      .from("users")
      .select("*")
      .eq("id", session.user.id)
      .single();

    if (userProfileError || !userProfile) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 401 }
      );
    }

    // Check if user has admin or superadmin role
    if (!["admin", "superadmin"].includes(userProfile.role)) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const { userId, amount, description } = await request.json();

    if (!userId || !amount || amount <= 0) {
      return NextResponse.json(
        { error: "Missing or invalid required fields" },
        { status: 400 }
      );
    }

    // Call the database function to add funds
    const { data, error } = await supabase.rpc("add_user_funds", {
      target_user_id: userId,
      amount: parseFloat(amount),
      admin_user_id: session.user.id,
      description: description || `Fund deposit by ${userProfile.username}`,
    });

    if (error) {
      console.error("Error adding funds:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Check if the function returned an error message
    if (data && data.startsWith("Error:")) {
      return NextResponse.json({ error: data }, { status: 400 });
    }

    return NextResponse.json({
      message: data || "Funds added successfully",
      success: true,
    });
  } catch (error) {
    console.error("Error in fund deposit:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

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

    const url = new URL(request.url);
    const userId = url.searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Get user balance
    const { data: balance, error: balanceError } = await supabase.rpc(
      "get_user_balance",
      {
        target_user_id: userId,
      }
    );

    if (balanceError) {
      console.error("Error getting balance:", balanceError);
      return NextResponse.json(
        { error: balanceError.message },
        { status: 400 }
      );
    }

    // Get transaction history
    const { data: transactions, error: transactionsError } = await supabase.rpc(
      "get_user_fund_transactions",
      {
        target_user_id: userId,
        limit_count: 20,
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
    console.error("Error getting fund information:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
