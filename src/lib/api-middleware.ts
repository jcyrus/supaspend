import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
import { User } from "@supabase/auth-js";
import { SupabaseClient } from "@supabase/supabase-js";

export interface UserProfile {
  id: string;
  username: string;
  role: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface AuthenticatedRequest extends NextRequest {
  user?: User;
  userProfile?: UserProfile;
}

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
  success?: boolean;
}

/**
 * Common authentication middleware for API routes
 */
export async function withAuth(
  request: NextRequest,
  options: {
    requireRole?: string[] | string;
    requireSuperadmin?: boolean;
  } = {}
): Promise<{
  success: boolean;
  response?: NextResponse;
  user?: User;
  userProfile?: UserProfile;
  supabase?: SupabaseClient;
}> {
  try {
    const { supabase } = createServerClient(request);

    // Check if user is authenticated
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session?.user) {
      return {
        success: false,
        response: NextResponse.json(
          { error: "Not authenticated" },
          { status: 401 }
        ),
      };
    }

    // Get user profile to check role
    const { data: userProfile, error: userProfileError } = await supabase
      .from("users")
      .select("*")
      .eq("id", session.user.id)
      .single();

    if (userProfileError || !userProfile) {
      return {
        success: false,
        response: NextResponse.json(
          { error: "User profile not found" },
          { status: 401 }
        ),
      };
    }

    // Check role requirements
    if (options.requireSuperadmin && userProfile.role !== "superadmin") {
      return {
        success: false,
        response: NextResponse.json(
          { error: "Superadmin privileges required" },
          { status: 403 }
        ),
      };
    }

    if (options.requireRole) {
      const requiredRoles = Array.isArray(options.requireRole)
        ? options.requireRole
        : [options.requireRole];

      if (!requiredRoles.includes(userProfile.role)) {
        return {
          success: false,
          response: NextResponse.json(
            { error: "Insufficient permissions" },
            { status: 403 }
          ),
        };
      }
    }

    return {
      success: true,
      user: session.user,
      userProfile,
      supabase,
    };
  } catch (error) {
    console.error("Authentication error:", error);
    return {
      success: false,
      response: NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      ),
    };
  }
}

/**
 * Standard error response helper
 */
export function errorResponse(
  message: string,
  status: number = 400
): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

/**
 * Standard success response helper
 */
export function successResponse<T>(data: T, message?: string): NextResponse {
  return NextResponse.json({
    success: true,
    data,
    ...(message && { message }),
  });
}

/**
 * Validate required fields in request body
 */
export function validateRequiredFields(
  body: Record<string, unknown>,
  requiredFields: string[]
): { isValid: boolean; missingFields?: string[] } {
  const missingFields = requiredFields.filter(
    (field) =>
      body[field] === undefined || body[field] === null || body[field] === ""
  );

  return {
    isValid: missingFields.length === 0,
    missingFields: missingFields.length > 0 ? missingFields : undefined,
  };
}

/**
 * Common admin client creation pattern
 */
export function createAdminClient() {
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
}
