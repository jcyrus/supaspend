"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  useEffect(() => {
    // Don't check auth for login page
    if (pathname === "/auth/login") {
      setIsLoading(false);
      return;
    }

    const checkAuth = async () => {
      try {
        // Use getUser() for secure server-side validation
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();

        if (error) {
          console.error("Auth error:", error);
          router.replace("/auth/login");
          return;
        }

        if (user) {
          setIsAuthenticated(true);
        } else {
          router.replace("/auth/login");
          return;
        }
      } catch (error) {
        console.error("Auth error:", error);
        router.replace("/auth/login");
        return;
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        setIsAuthenticated(false);
        router.replace("/auth/login");
      } else if (event === "SIGNED_IN" && session) {
        setIsAuthenticated(true);
      }
    });

    return () => subscription.unsubscribe();
  }, [pathname, router, supabase]);

  // Show loading for protected routes
  if (isLoading && pathname !== "/auth/login") {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Authenticating...
          </p>
        </div>
      </div>
    );
  }

  // Don't render protected content if not authenticated (except login page)
  if (!isAuthenticated && pathname !== "/auth/login") {
    return null;
  }

  return <>{children}</>;
}
