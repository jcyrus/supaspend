import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";

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

    // Get users with balances
    const { data: usersWithBalances, error } = await supabase.rpc(
      "get_admin_users_with_balances",
      {
        admin_id: session.user.id,
      }
    );

    if (error) {
      console.error("Error fetching users with balances:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({
      users: usersWithBalances || [],
    });
  } catch (error) {
    console.error("Error in users with balances endpoint:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
