import { NextRequest } from "next/server";
import {
  withAuth,
  createAdminClient,
  errorResponse,
  successResponse,
} from "@/lib/api-middleware";

export async function GET(request: NextRequest) {
  // Use middleware for authentication and authorization
  const authResult = await withAuth(request, {
    requireRole: ["admin", "superadmin"],
  });

  if (!authResult.success) {
    return authResult.response!;
  }

  try {
    const { searchParams } = new URL(request.url);
    const userIds = searchParams.get("userIds");

    if (!userIds) {
      return errorResponse("User IDs are required");
    }

    const adminSupabase = createAdminClient();
    const userIdArray = userIds.split(",");
    const emails: { [key: string]: string } = {};

    // Fetch email addresses for each user
    for (const userId of userIdArray) {
      try {
        const { data: authUser } = await adminSupabase.auth.admin.getUserById(
          userId
        );
        if (authUser.user && authUser.user.email) {
          emails[userId] = authUser.user.email;
        }
      } catch (error) {
        console.error(`Error fetching email for user ${userId}:`, error);
        emails[userId] = "Email not available";
      }
    }

    return successResponse({ emails });
  } catch (error) {
    console.error("Error fetching user emails:", error);
    return errorResponse("Internal server error", 500);
  }
}
