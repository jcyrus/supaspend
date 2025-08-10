import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserServer } from "@/lib/auth-utils-server";

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUserServer(request);

    if (!currentUser?.profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({
      profile: currentUser.profile,
      email: currentUser.email,
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const currentUser = await getCurrentUserServer(request);

    if (!currentUser?.profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { display_name, username, avatar_url } = body;

    // Validate required fields
    if (!username?.trim()) {
      return NextResponse.json(
        { error: "Username is required" },
        { status: 400 }
      );
    }

    const { supabase } = createClient(request);

    // Check if username is already taken by another user
    if (username !== currentUser.profile.username) {
      const { data: existingUser } = await supabase
        .from("users")
        .select("id")
        .eq("username", username)
        .neq("id", currentUser.id)
        .single();

      if (existingUser) {
        return NextResponse.json(
          { error: "Username is already taken" },
          { status: 400 }
        );
      }
    }

    // Update user profile
    const { data, error } = await supabase
      .from("users")
      .update({
        display_name: display_name?.trim() || null,
        username: username.trim(),
        avatar_url: avatar_url?.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", currentUser.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating profile:", error);
      console.error("Error details:", {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      });
      console.error("User ID:", currentUser.id);
      console.error("Auth user:", currentUser.email);

      return NextResponse.json(
        {
          error: "Failed to update profile",
          details: error.message,
          statusCode: error.code === "42501" ? "403" : "500",
        },
        { status: error.code === "42501" ? 403 : 500 }
      );
    }

    return NextResponse.json({
      message: "Profile updated successfully",
      profile: data,
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
