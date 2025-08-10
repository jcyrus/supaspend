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
    const { email, password, username, role, currency, walletName } = body;

    // Validate required fields using middleware
    const validation = validateRequiredFields(body, [
      "email",
      "password",
      "username",
      "role",
      "currency",
    ]);
    if (!validation.isValid) {
      return errorResponse(
        `Missing required fields: ${validation.missingFields?.join(", ")}`
      );
    }

    // Validate currency
    if (!["USD", "VND", "IDR", "PHP"].includes(currency)) {
      return errorResponse("Invalid currency. Must be USD, VND, IDR, or PHP");
    }

    const adminSupabase = createAdminClient();

    // Create the user account
    const { data: authData, error: authError } =
      await adminSupabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          username,
        },
      });

    if (authError) {
      console.error("Auth error:", authError);
      return errorResponse(
        `Database error creating new user: ${authError.message}`
      );
    }

    if (!authData.user) {
      return errorResponse("Failed to create user");
    }

    // Wait a moment for the trigger to create the profile
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Check if the profile was created by the trigger
    const { error: profileCheckError } = await adminSupabase
      .from("users")
      .select("id, username, role")
      .eq("id", authData.user.id)
      .single();

    if (profileCheckError && profileCheckError.code !== "PGRST116") {
      console.error("Profile check error:", profileCheckError);
      await adminSupabase.auth.admin.deleteUser(authData.user.id);
      return errorResponse(
        `Profile check failed: ${profileCheckError.message}`
      );
    }

    // Update the profile with admin-specified values (trigger creates basic profile)
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
      return errorResponse(
        `Profile update failed: ${upsertProfileError.message}`
      );
    }

    // Create the initial wallet using a secure database function
    try {
      console.log("Creating wallet for user:", authData.user.id);
      console.log("Using currency:", currency);
      console.log("Wallet name:", walletName || `${currency} Wallet`);

      const { data: walletData, error: walletError } = await adminSupabase.rpc(
        "admin_create_wallet",
        {
          p_user_id: authData.user.id,
          p_currency: currency,
          p_name: walletName || `${currency} Wallet`,
          p_is_default: true,
        }
      );

      if (walletError) {
        console.error("Wallet error details:", walletError);
        throw new Error(walletError.message);
      }

      console.log("Wallet created successfully:", walletData);
    } catch (walletError) {
      console.error("Wallet creation error:", walletError);
      // If wallet creation fails, clean up the user
      await adminSupabase.auth.admin.deleteUser(authData.user.id);
      return errorResponse(
        "Failed to create wallet: " + (walletError as Error).message
      );
    }

    return successResponse({
      message: `User ${email} created successfully with ${currency} wallet`,
      user: {
        id: authData.user.id,
        email: authData.user.email,
        username,
        role,
        currency,
        walletName: walletName || `${currency} Wallet`,
      },
    });
  } catch (error) {
    console.error("Error creating user:", error);
    return errorResponse("Internal server error", 500);
  }
}
