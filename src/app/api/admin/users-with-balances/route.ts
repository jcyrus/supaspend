import { NextRequest } from "next/server";
import { withAuth, errorResponse, successResponse } from "@/lib/api-middleware";

export async function GET(request: NextRequest) {
  // Use middleware for authentication and authorization
  const authResult = await withAuth(request, {
    requireRole: ["admin", "superadmin"],
  });

  if (!authResult.success) {
    return authResult.response!;
  }

  const { user, supabase } = authResult;

  try {
    // Get users with balances
    const { data: usersWithBalances, error } = await supabase!.rpc(
      "get_admin_users_with_balances",
      {
        admin_id: user?.id,
      }
    );

    if (error) {
      console.error("Error fetching users with balances:", error);
      return errorResponse(error.message);
    }

    return successResponse({
      users: usersWithBalances || [],
    });
  } catch (error) {
    console.error("Error in users with balances endpoint:", error);
    return errorResponse("Internal server error", 500);
  }
}
