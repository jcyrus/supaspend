import { NextRequest } from "next/server";
import {
  withAuth,
  validateRequiredFields,
  errorResponse,
  successResponse,
} from "@/lib/api-middleware";

export async function POST(request: NextRequest) {
  // Use middleware for authentication and authorization
  const authResult = await withAuth(request, {
    requireRole: ["admin", "superadmin"],
  });

  if (!authResult.success) {
    return authResult.response!;
  }

  const { user, userProfile, supabase } = authResult;

  try {
    const body = await request.json();
    const { recipient_id, amount, description } = body;

    // Validate required fields
    const validation = validateRequiredFields(body, [
      "recipient_id",
      "amount",
      "description",
    ]);
    if (!validation.isValid) {
      return errorResponse(
        `Missing required fields: ${validation.missingFields?.join(", ")}`
      );
    }

    // Call the database function to add funds
    const { data, error } = await supabase!.rpc("add_user_funds", {
      target_user_id: recipient_id,
      amount: parseFloat(amount),
      admin_user_id: user?.id,
      description: description || `Fund deposit by ${userProfile?.username}`,
    });

    if (error) {
      console.error("Error adding funds:", error);
      return errorResponse(error.message);
    }

    // Check if the function returned an error message
    if (data && data.startsWith("Error:")) {
      return errorResponse(data);
    }

    return successResponse({
      message: data || "Funds added successfully",
    });
  } catch (error) {
    console.error("Error in fund deposit:", error);
    return errorResponse("Internal server error", 500);
  }
}

export async function GET(request: NextRequest) {
  // Use middleware for authentication
  const authResult = await withAuth(request);

  if (!authResult.success) {
    return authResult.response!;
  }

  const { supabase } = authResult;

  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get("userId");

    if (!userId) {
      return errorResponse("User ID is required");
    }

    // Get user balance
    const { data: balance, error: balanceError } = await supabase!.rpc(
      "get_user_balance",
      {
        target_user_id: userId,
      }
    );

    if (balanceError) {
      console.error("Error getting balance:", balanceError);
      return errorResponse(balanceError.message);
    }

    // Get transaction history
    const { data: transactions, error: transactionsError } =
      await supabase!.rpc("get_user_fund_transactions", {
        target_user_id: userId,
        limit_count: 20,
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
    console.error("Error getting fund information:", error);
    return errorResponse("Internal server error", 500);
  }
}
