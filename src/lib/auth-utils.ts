import { createClient } from "@/lib/supabase/client";
import type { UserRole, User, AdminUserExpense } from "@/types/database";
import type { User as SupabaseUser } from "@supabase/supabase-js";

interface UserWithProfile extends SupabaseUser {
  profile: User;
}

export async function getCurrentUser(): Promise<UserWithProfile | null> {
  const supabase = createClient();

  try {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session?.user) {
      return null;
    }

    const { data: userProfile, error: profileError } = await supabase
      .from("users")
      .select("*")
      .eq("id", session.user.id)
      .single();

    if (profileError) {
      console.error("Error fetching user profile:", profileError);
      console.error("User ID:", session.user.id);
      console.error("Error details:", {
        code: profileError.code,
        message: profileError.message,
        details: profileError.details,
        hint: profileError.hint,
      });

      // If user profile doesn't exist, try to create it
      if (profileError.code === "PGRST116") {
        // No rows returned
        console.log("User profile not found, creating one...");
        return await createUserProfile(session.user);
      }

      return null;
    }

    if (!userProfile) {
      console.warn("No user profile found for user ID:", session.user.id);
      return await createUserProfile(session.user);
    }

    return {
      ...session.user,
      profile: userProfile,
    };
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
}

// Helper function to create user profile if missing
async function createUserProfile(
  authUser: SupabaseUser
): Promise<UserWithProfile | null> {
  const supabase = createClient();

  try {
    console.log("Creating user profile for:", authUser.id);

    // Extract username from email (before @) or use a default
    const username =
      authUser.email?.split("@")[0] || `user_${authUser.id.slice(0, 8)}`;

    const { data: newProfile, error: createError } = await supabase
      .from("users")
      .insert({
        id: authUser.id,
        username: username,
        role: "user", // Default role
        created_by: null, // No creator for auto-created profiles
      })
      .select()
      .single();

    if (createError) {
      console.error("Error creating user profile:", createError);
      return null;
    }

    console.log("User profile created successfully:", newProfile);

    return {
      ...authUser,
      profile: newProfile,
    };
  } catch (error) {
    console.error("Error in createUserProfile:", error);
    return null;
  }
}

export async function checkUserRole(requiredRole: UserRole): Promise<boolean> {
  const user = await getCurrentUser();

  if (!user?.profile) {
    return false;
  }

  const roleHierarchy: Record<UserRole, number> = {
    user: 1,
    admin: 2,
    superadmin: 3,
  };

  const userLevel = roleHierarchy[user.profile.role as UserRole];
  const requiredLevel = roleHierarchy[requiredRole];

  return userLevel >= requiredLevel;
}

// Get users created by the current admin
export async function getAdminUsers(): Promise<User[]> {
  const supabase = createClient();
  const user = await getCurrentUser();

  if (!user?.profile || !["admin", "superadmin"].includes(user.profile.role)) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("created_by", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching admin users:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Error fetching admin users:", error);
    return [];
  }
}

// Get expenses for users created by the current admin
export async function getAdminUserExpenses(): Promise<AdminUserExpense[]> {
  const supabase = createClient();
  const user = await getCurrentUser();

  if (!user?.profile || !["admin", "superadmin"].includes(user.profile.role)) {
    return [];
  }

  try {
    const { data, error } = await supabase.rpc("get_admin_user_expenses", {
      admin_id: user.id,
    });

    if (error) {
      console.error("Error fetching admin user expenses:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Error fetching admin user expenses:", error);
    return [];
  }
}
