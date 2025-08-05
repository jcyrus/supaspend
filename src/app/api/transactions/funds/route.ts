import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface FundTransaction {
  id: string;
  user_id: string;
  admin_id: string | null;
  type: string;
  amount: number;
  new_balance: number;
  description: string | null;
  created_at: string;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const allUsers = searchParams.get("allUsers") === "true";
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

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
      .from("fund_transactions")
      .select("*")
      .order("created_at", { ascending: false });

    // If not admin or not requesting all users, filter by current user
    if (!isAdmin || !allUsers) {
      query = query.eq("user_id", user.id);
    } else if (isAdmin && allUsers) {
      // For admin viewing all users, only show transactions for users they created
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

    // Apply date filters
    if (dateFrom) {
      query = query.gte("created_at", dateFrom);
    }
    if (dateTo) {
      query = query.lte("created_at", `${dateTo}T23:59:59.999Z`);
    }

    const { data: transactions, error } = await query;

    if (error) {
      console.error("Error fetching fund transactions:", error);
      return NextResponse.json(
        { error: "Failed to fetch fund transactions", details: error.message },
        { status: 500 }
      );
    }

    // Transform the data to match the expected format for the frontend
    const transformedTransactions =
      transactions?.map((transaction: FundTransaction) => ({
        transaction_id: transaction.id,
        user_id: transaction.user_id,
        admin_id: transaction.admin_id,
        transaction_type: transaction.type,
        amount: transaction.amount,
        new_balance: transaction.new_balance,
        description: transaction.description,
        created_at: transaction.created_at,
        username: "User", // Simplified for now - could be enhanced to fetch actual usernames
        admin_username: transaction.admin_id ? "Admin" : null,
      })) || [];

    return NextResponse.json({ transactions: transformedTransactions });
  } catch (error) {
    console.error("Error in fund transactions API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
