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

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const userIds = searchParams.get("userIds");

    if (!userIds) {
      return NextResponse.json(
        { error: "User IDs are required" },
        { status: 400 }
      );
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

    return NextResponse.json({ emails });
  } catch (error) {
    console.error("Error fetching user emails:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
