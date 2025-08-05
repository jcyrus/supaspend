import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  const { supabase, response } = createClient(request);

  // Refresh session if expired - required for Server Components
  await supabase.auth.getSession();

  // Check if the user is authenticated
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Redirect to login if not authenticated and trying to access protected routes
  if (
    !session &&
    (request.nextUrl.pathname.startsWith("/dashboard") ||
      request.nextUrl.pathname.startsWith("/expenses") ||
      request.nextUrl.pathname.startsWith("/reports"))
  ) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  // Redirect to dashboard if authenticated and trying to access auth routes
  if (session && request.nextUrl.pathname.startsWith("/auth/login")) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
