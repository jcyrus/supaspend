import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const allUsers = searchParams.get("allUsers") === "true";
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const category = searchParams.get("category");
    const minAmount = searchParams.get("minAmount");
    const maxAmount = searchParams.get("maxAmount");
    const walletId = searchParams.get("walletId");

    // Use server-side auth
    const { supabase } = createClient(req);

    // Check if user is authenticated (using getUser for security)
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Get user profile to check role
    const { data: userProfile, error: userProfileError } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .single();

    if (userProfileError || !userProfile) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 401 }
      );
    }

    const isAdmin = ["admin", "superadmin"].includes(userProfile.role);

    let query = supabase
      .from("expenses")
      .select(
        `
        *,
        wallet:wallets(id, name, currency)
      `
      )
      .order("date", { ascending: false });

    // If not admin or not requesting all users, filter by current user
    if (!isAdmin || !allUsers) {
      query = query.eq("user_id", user.id);
    } else if (isAdmin && allUsers) {
      // For admin viewing all users, only show users they created
      const { data: adminUsers } = await supabase
        .from("users")
        .select("id")
        .eq("created_by", user.id);

      if (adminUsers && adminUsers.length > 0) {
        const userIds = [
          user.id,
          ...adminUsers.map((u: { id: string }) => u.id),
        ];
        query = query.in("user_id", userIds);
      } else {
        query = query.eq("user_id", user.id);
      }
    }

    // Apply filters
    if (dateFrom) {
      query = query.gte("date", dateFrom);
    }
    if (dateTo) {
      query = query.lte("date", dateTo);
    }
    if (category && category !== "all") {
      query = query.eq("category", category);
    }
    if (minAmount) {
      query = query.gte("amount", parseFloat(minAmount));
    }
    if (maxAmount) {
      query = query.lte("amount", parseFloat(maxAmount));
    }
    if (walletId && walletId !== "all") {
      query = query.eq("wallet_id", walletId);
    }

    const { data: expenses, error } = await query;

    if (error) {
      console.error("Error fetching expenses:", error);
      return NextResponse.json(
        { error: "Failed to fetch expenses", details: error.message },
        { status: 500 }
      );
    }

    // For now, return expenses without edit history to get basic functionality working
    // We can add edit history back once the basic queries are working
    const transformedExpenses = expenses || [];

    return NextResponse.json({ expenses: transformedExpenses });
  } catch (error) {
    console.error("Error in expenses API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
