import { NextRequest } from "next/server";
import {
  withAuth,
  validateRequiredFields,
  createAdminClient,
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

  const { user } = authResult;

  try {
    const body = await request.json();
    const { email, password, username, role } = body;

    // Validate required fields using middleware
    const validation = validateRequiredFields(body, [
      "email",
      "password",
      "username",
      "role",
    ]);
    if (!validation.isValid) {
      return errorResponse(
        `Missing required fields: ${validation.missingFields?.join(", ")}`
      );
    }

    const adminSupabase = createAdminClient();

    // Create the user account
    const { data: authData, error: authError } =
      await adminSupabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

    if (authError) {
      console.error("Auth error:", authError);
      return errorResponse(authError.message);
    }

    if (!authData.user) {
      return errorResponse("Failed to create user");
    }

    // Upsert the user profile (the trigger creates a default profile, we need to update it with correct values)
    const { error: upsertProfileError } = await adminSupabase
      .from("users")
      .upsert(
        {
          id: authData.user.id,
          username,
          role,
          created_by: user?.id,
        },
        {
          onConflict: "id",
        }
      );

    if (upsertProfileError) {
      console.error("Profile upsert error:", upsertProfileError);
      // If profile upsert fails, clean up the auth user
      await adminSupabase.auth.admin.deleteUser(authData.user.id);
      return errorResponse(upsertProfileError.message);
    }

    return successResponse({
      message: `User ${email} created successfully`,
      user: {
        id: authData.user.id,
        email: authData.user.email,
        username,
        role,
      },
    });
  } catch (error) {
    console.error("Error creating user:", error);
    return errorResponse("Internal server error", 500);
  }
}
