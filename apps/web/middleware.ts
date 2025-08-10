import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  const { supabase, response } = createClient(request);

  try {
    // Use getUser() for secure authentication check
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    // Redirect to login if not authenticated and trying to access protected routes
    if (
      (!user || error) &&
      (request.nextUrl.pathname.startsWith("/dashboard") ||
        request.nextUrl.pathname.startsWith("/expenses") ||
        request.nextUrl.pathname.startsWith("/reports"))
    ) {
      return NextResponse.redirect(new URL("/auth/login", request.url));
    }

    // Redirect to dashboard if authenticated and trying to access auth routes
    if (user && !error && request.nextUrl.pathname.startsWith("/auth/login")) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    return response;
  } catch (error) {
    console.error("Middleware auth error:", error);
    // If there's an error, redirect to login for protected routes
    if (
      request.nextUrl.pathname.startsWith("/dashboard") ||
      request.nextUrl.pathname.startsWith("/expenses") ||
      request.nextUrl.pathname.startsWith("/reports")
    ) {
      return NextResponse.redirect(new URL("/auth/login", request.url));
    }

    return response;
  }
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
