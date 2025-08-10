import { NextRequest } from "next/server";
import {
  withAuth,
  createAdminClient,
  errorResponse,
  successResponse,
} from "@/lib/api-middleware";

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  // Use middleware for authentication and authorization
  const authResult = await withAuth(request, {
    requireRole: ["admin", "superadmin"],
  });

  if (!authResult.success) {
    return authResult.response!;
  }

  try {
    const params = await context.params;
    const { id } = params;

    // Check if the current user has superadmin role (only superadmin can delete users)
    if (authResult.userProfile?.role !== "superadmin") {
      return errorResponse(
        "Access denied. Superadmin role required to delete users.",
        403
      );
    }

    // Create admin client for user deletion
    const adminSupabase = createAdminClient();

    // Delete the user from auth
    const { error } = await adminSupabase.auth.admin.deleteUser(id);

    if (error) {
      console.error("Error deleting user:", error);
      return errorResponse(error.message, 400);
    }

    return successResponse({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error in DELETE /api/admin/users/[id]:", error);
    return errorResponse("Internal server error", 500);
  }
}
