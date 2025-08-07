import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface FundTransaction {
  id: string;
  user_id: string;
  admin_id: string | null;
  transaction_type: string;
  amount: number;
  new_balance: number;
  description: string | null;
  created_at: string;
}

interface TransformedTransaction {
  transaction_id: string;
  user_id: string;
  admin_id: string | null;
  transaction_type: string;
  amount: number;
  new_balance: number;
  description: string | null;
  created_at: string;
  username: string;
  admin_username: string | null;
  sender: string;
  recipient: string;
  display_type: string;
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
      .select(
        "id, user_id, admin_id, transaction_type, amount, new_balance, description, created_at"
      )
      .order("created_at", { ascending: false });

    // Filter transactions based on view mode
    if (!allUsers || !isAdmin) {
      // "My Transactions" mode: Show transactions where user is involved as sender OR recipient
      query = query.or(`user_id.eq.${user.id},admin_id.eq.${user.id}`);
    } else if (isAdmin && allUsers) {
      // "All Users" mode: For admin viewing all users, show transactions for users they created
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

    // Get all unique user IDs for username lookup
    const userIds = new Set<string>();
    const adminIds = new Set<string>();

    transactions?.forEach((transaction) => {
      if (transaction.user_id) userIds.add(transaction.user_id);
      if (transaction.admin_id) adminIds.add(transaction.admin_id);
    });

    const allUserIds = Array.from(new Set([...userIds, ...adminIds]));

    // Fetch usernames for all involved users
    const { data: users } = await supabase
      .from("users")
      .select("id, username")
      .in("id", allUserIds);

    const usernameMap = new Map<string, string>();
    users?.forEach((u) => {
      usernameMap.set(u.id, u.username);
    });

    // Transform transactions with proper sender/recipient logic
    const transformedTransactions =
      transactions?.map((transaction: FundTransaction) => {
        const isCurrentUserTheRecipient = transaction.user_id === user.id;
        const isCurrentUserTheSender = transaction.admin_id === user.id;

        let sender = "System";
        let recipient = "Unknown";
        let display_type = "credit";

        // Determine sender and recipient based on transaction type
        if (
          transaction.transaction_type === "fund_in" ||
          transaction.transaction_type === "deposit"
        ) {
          // Money coming in
          if (transaction.admin_id) {
            sender = usernameMap.get(transaction.admin_id) || "Unknown Admin";
          } else {
            sender = "System"; // Self top-up
          }
          recipient = usernameMap.get(transaction.user_id) || "Unknown User";

          // Determine display type from current user's perspective
          if (isCurrentUserTheRecipient) {
            display_type = "credit";
            sender = transaction.admin_id
              ? usernameMap.get(transaction.admin_id) || "Admin"
              : "System";
            recipient = "You";
          } else if (isCurrentUserTheSender) {
            display_type = "debit";
            sender = "You";
            recipient = usernameMap.get(transaction.user_id) || "Unknown User";
          } else {
            display_type = "credit";
            recipient = usernameMap.get(transaction.user_id) || "User";
          }
        } else if (
          transaction.transaction_type === "fund_out" ||
          transaction.transaction_type === "withdrawal"
        ) {
          // Money going out
          sender = usernameMap.get(transaction.user_id) || "Unknown User";
          if (transaction.admin_id) {
            recipient =
              usernameMap.get(transaction.admin_id) || "Unknown Admin";
          } else {
            recipient = "System";
          }

          // Determine display type from current user's perspective
          if (isCurrentUserTheRecipient) {
            display_type = "credit";
            sender = usernameMap.get(transaction.user_id) || "User";
            recipient = "You";
          } else if (isCurrentUserTheSender) {
            display_type = "debit";
            sender = "You";
            recipient = usernameMap.get(transaction.user_id) || "User";
          } else {
            display_type = "debit";
            sender = usernameMap.get(transaction.user_id) || "User";
          }
        }

        return {
          transaction_id: transaction.id,
          user_id: transaction.user_id,
          admin_id: transaction.admin_id,
          transaction_type: transaction.transaction_type,
          amount: transaction.amount,
          new_balance: transaction.new_balance,
          description: transaction.description,
          created_at: transaction.created_at,
          username: usernameMap.get(transaction.user_id) || "Unknown User",
          admin_username: transaction.admin_id
            ? usernameMap.get(transaction.admin_id) || "Unknown Admin"
            : null,
          sender,
          recipient,
          display_type,
        };
      }) || [];

    return NextResponse.json({ transactions: transformedTransactions });
  } catch (error) {
    console.error("Error in fund transactions API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
