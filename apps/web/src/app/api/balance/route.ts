import { NextRequest } from "next/server";
import { withAuth, errorResponse, successResponse } from "@/lib/api-middleware";

export async function GET(request: NextRequest) {
  // Use middleware for authentication
  const authResult = await withAuth(request);

  if (!authResult.success) {
    return authResult.response!;
  }

  const { user, supabase } = authResult;

  try {
    // Get user balance
    const { data: balance, error: balanceError } = await supabase!.rpc(
      "get_user_balance",
      {
        target_user_id: user?.id,
      }
    );

    if (balanceError) {
      console.error("Error getting balance:", balanceError);
      return errorResponse(balanceError.message);
    }

    // Get recent transaction history
    const { data: transactions, error: transactionsError } =
      await supabase!.rpc("get_user_fund_transactions", {
        target_user_id: user?.id,
        limit_count: 10,
      });

    if (transactionsError) {
      console.error("Error getting transactions:", transactionsError);
      return errorResponse(transactionsError.message);
    }

    return successResponse({
      balance: balance || 0,
      transactions: transactions || [],
    });
  } catch (error) {
    console.error("Error getting user balance:", error);
    return errorResponse("Internal server error", 500);
  }
}
