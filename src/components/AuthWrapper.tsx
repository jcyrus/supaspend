"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

interface AuthWrapperProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

export default function AuthWrapper({
  children,
  requireAuth = true,
}: AuthWrapperProps) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const checkAuth = async () => {
      try {
        // Set a timeout to prevent infinite loading
        timeoutId = setTimeout(() => {
          console.warn("Auth check timeout - redirecting to login");
          if (requireAuth) {
            router.push("/auth/login");
          } else {
            setLoading(false);
          }
        }, 10000); // 10 second timeout

        // Use direct Supabase session check instead of getCurrentUser to avoid circular dependency
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        // Clear timeout if we get a response
        clearTimeout(timeoutId);

        if (error) {
          console.error("Session error:", error);
          if (requireAuth) {
            router.push("/auth/login");
            return;
          }
        }

        if (session?.user) {
          setUser(session.user);
        } else if (requireAuth) {
          // User not authenticated and auth is required
          router.push("/auth/login");
          return;
        }
      } catch (error) {
        clearTimeout(timeoutId);
        console.error("Auth check error:", error);
        if (requireAuth) {
          router.push("/auth/login");
          return;
        }
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_OUT" && requireAuth) {
        setUser(null);
        router.push("/auth/login");
      } else if (event === "SIGNED_IN" && session) {
        setUser(session.user);
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [supabase, router, requireAuth]);

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  // If auth is required but user is not authenticated, don't render children
  if (requireAuth && !user) {
    return null;
  }

  return <>{children}</>;
}
