import { createClient } from "@/lib/supabase/server";
import type { UserRole, User, Database } from "@/types/database";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { NextRequest } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";

interface UserWithProfile extends SupabaseUser {
  profile: User;
}

export async function getCurrentUserServer(
  request: NextRequest
): Promise<UserWithProfile | null> {
  const { supabase } = createClient(request);

  try {
    // Use getUser() for secure server-side validation
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return null;
    }

    const { data: userProfile, error: profileError } = await supabase
      .from("users")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      if (process.env.NODE_ENV !== "production") {
        console.error("Error fetching user profile:", profileError);
        console.error("User ID:", user.id);
        console.error("Error details:", {
          code: profileError.code,
          message: profileError.message,
          details: profileError.details,
          hint: profileError.hint,
        });
      }
      return null;
    }

    if (!userProfile) {
      if (process.env.NODE_ENV !== "production") {
        console.log("User profile not found, creating one...");
      }
      return await createUserProfileServer(user, supabase);
    }

    return {
      ...user,
      profile: userProfile,
    };
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("Error getting current user:", error);
    }
    return null;
  }
}

// Helper function to create user profile if missing
async function createUserProfileServer(
  authUser: SupabaseUser,
  supabase: ReturnType<typeof createClient>["supabase"]
): Promise<UserWithProfile | null> {
  try {
    if (process.env.NODE_ENV !== "production") {
      console.log("Creating user profile for:", authUser.id);
    }

    // Sanitize email prefix and ensure uniqueness
    const emailPrefix = authUser.email?.split("@")[0] || "user";
    const sanitizedPrefix = emailPrefix
      .replace(/[^a-zA-Z0-9_]/g, "")
      .toLowerCase();
    const userIdFragment = authUser.id.slice(0, 8);
    const username = `${sanitizedPrefix}_${userIdFragment}`;

    // Use upsert to handle concurrent requests and make operation idempotent
    const { data: newProfile, error: createError } = await supabase
      .from("users")
      .upsert(
        {
          id: authUser.id,
          username: username,
          role: "user", // Default role
          created_by: null, // No creator for auto-created profiles
        },
        {
          onConflict: "id",
          ignoreDuplicates: false, // Return the existing row if it exists
        }
      )
      .select()
      .single();

    if (createError) {
      if (process.env.NODE_ENV !== "production") {
        console.error("Error creating user profile:", createError);
      }
      return null;
    }

    if (process.env.NODE_ENV !== "production") {
      console.log("User profile created successfully:", newProfile);
    }

    return {
      ...authUser,
      profile: newProfile,
    };
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("Error in createUserProfileServer:", error);
    }
    return null;
  }
}

export async function checkUserRoleServer(
  requiredRole: UserRole,
  request: NextRequest
): Promise<boolean> {
  const user = await getCurrentUserServer(request);

  if (!user?.profile) {
    return false;
  }

  const roleHierarchy: Record<UserRole, number> = {
    user: 1,
    admin: 2,
    superadmin: 3,
  };

  const userLevel = roleHierarchy[user.profile.role as UserRole] ?? 0;
  const requiredLevel = roleHierarchy[requiredRole];

  return userLevel >= requiredLevel;
}
