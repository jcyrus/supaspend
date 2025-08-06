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

    // Initialize balance records for any users who don't have them
    // This ensures consistency with individual user balance API calls
    if (usersWithBalances && usersWithBalances.length > 0) {
      for (const userData of usersWithBalances) {
        if (userData.user_id) {
          // Initialize balance record if it doesn't exist
          await supabase!.rpc("initialize_user_balance", {
            target_user_id: userData.user_id,
          });
        }
      }

      // Refetch the balances after initialization to get accurate values
      const { data: updatedBalances, error: refetchError } =
        await supabase!.rpc("get_admin_users_with_balances", {
          admin_id: user?.id,
        });

      if (refetchError) {
        console.error("Error refetching users with balances:", refetchError);
        // Return original data if refetch fails
        return successResponse({
          users: usersWithBalances || [],
        });
      }

      return successResponse({
        users: updatedBalances || [],
      });
    }

    return successResponse({
      users: usersWithBalances || [],
    });
  } catch (error) {
    console.error("Error in users with balances endpoint:", error);
    return errorResponse("Internal server error", 500);
  }
}
