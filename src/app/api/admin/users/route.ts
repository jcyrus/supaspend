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

export async function POST(request: NextRequest) {
  try {
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

    const { email, password, username, role } = await request.json();

    if (!email || !password || !username || !role) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
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
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: "Failed to create user" },
        { status: 400 }
      );
    }

    // Upsert the user profile (the trigger creates a default profile, we need to update it with correct values)
    const { error: upsertProfileError } = await adminSupabase
      .from("users")
      .upsert(
        {
          id: authData.user.id,
          username,
          role,
          created_by: session.user.id,
        },
        {
          onConflict: "id",
        }
      );

    if (upsertProfileError) {
      console.error("Profile upsert error:", upsertProfileError);
      // If profile upsert fails, clean up the auth user
      await adminSupabase.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json(
        { error: upsertProfileError.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
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
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
