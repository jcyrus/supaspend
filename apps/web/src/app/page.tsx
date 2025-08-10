"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function Home() {
  const supabase = createClient();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const checkUser = async () => {
      try {
        // Set a timeout to prevent infinite loading
        timeoutId = setTimeout(() => {
          console.warn("Session check timeout - redirecting to login");
          router.push("/auth/login");
        }, 5000); // 5 second timeout

        // Use getUser() for secure authentication check
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();

        clearTimeout(timeoutId);

        if (error) {
          console.error("Auth check error:", error);
          router.push("/auth/login");
          return;
        }

        if (user) {
          // User is authenticated, redirect to dashboard
          router.push("/dashboard");
        } else {
          // User is not authenticated, redirect to login
          router.push("/auth/login");
        }
      } catch (error) {
        clearTimeout(timeoutId);
        console.error("Auth check error:", error);
        router.push("/auth/login");
      } finally {
        setIsChecking(false);
      }
    };

    checkUser();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [supabase, router]);

  // Show loading state while checking authentication
  if (isChecking) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">
            Checking authentication...
          </p>
        </div>
      </div>
    );
  }

  // This should not be reached as we redirect in useEffect
  return null;
}
