import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";

// Create admin client with service role key
const createAdminClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
};

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;

    // Use server-side auth
    const { supabase } = createServerClient(request);

    // Check if user is authenticated
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session?.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Get user profile to check role
    const { data: userProfile, error: userProfileError } = await supabase
      .from("users")
      .select("*")
      .eq("id", session.user.id)
      .single();

    if (userProfileError || !userProfile) {
      return NextResponse.json(
        { error: "User profile not found" },
        { status: 401 }
      );
    }

    // Check if user has admin or superadmin role
    if (!["admin", "superadmin"].includes(userProfile.role)) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const userId = params.id;
    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const adminSupabase = createAdminClient();

    // Delete the user
    const { error } = await adminSupabase.auth.admin.deleteUser(userId);

    if (error) {
      console.error("Error deleting user:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
