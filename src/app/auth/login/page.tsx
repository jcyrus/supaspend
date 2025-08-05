"use client";

import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { Sun, Moon } from "lucide-react";

export default function LoginPage() {
  const supabase = createClient();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        router.push("/dashboard");
      }
    };

    checkUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        router.push("/dashboard");
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase, router]);

  // Force input text color in dark mode
  useEffect(() => {
    const addInputStyles = () => {
      const existingStyle = document.getElementById("auth-input-override");
      if (existingStyle) {
        existingStyle.remove();
      }

      const style = document.createElement("style");
      style.id = "auth-input-override";
      style.innerHTML = `
        .supabase-auth-ui_ui input[type="email"],
        .supabase-auth-ui_ui input[type="password"],
        .supabase-auth-ui_ui input[type="text"] {
          color: white !important;
          background-color: #374151 !important;
          border-color: #4b5563 !important;
        }
        .supabase-auth-ui_ui input[type="email"]::placeholder,
        .supabase-auth-ui_ui input[type="password"]::placeholder,
        .supabase-auth-ui_ui input[type="text"]::placeholder {
          color: #9ca3af !important;
        }
        .supabase-auth-ui_ui input[type="email"]:focus,
        .supabase-auth-ui_ui input[type="password"]:focus,
        .supabase-auth-ui_ui input[type="text"]:focus {
          color: white !important;
          background-color: #374151 !important;
          border-color: #3b82f6 !important;
          outline: none !important;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5) !important;
        }
      `;
      document.head.appendChild(style);
    };

    // Add styles immediately
    addInputStyles();

    // Also add styles after a small delay in case the component renders later
    const timeout = setTimeout(addInputStyles, 100);

    return () => {
      clearTimeout(timeout);
      const style = document.getElementById("auth-input-override");
      if (style) {
        style.remove();
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Theme Toggle */}
      <div className="absolute top-4 right-4">
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
          aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
        >
          {theme === "light" ? (
            <Moon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
          ) : (
            <Sun className="h-5 w-5 text-gray-600 dark:text-gray-300" />
          )}
        </button>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Petty Cash Tracker
          </h1>
          <h2 className="text-xl text-gray-600 dark:text-gray-300">
            Sign in to your account
          </h2>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-gray-800 py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <Auth
            supabaseClient={supabase}
            view="sign_in"
            showLinks={false}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: "#3b82f6",
                    brandAccent: "#2563eb",
                    inputText: "#ffffff",
                    inputBackground: "#374151",
                    inputBorder: "#4b5563",
                    inputPlaceholder: "#9ca3af",
                  },
                  space: {
                    inputPadding: "12px",
                  },
                  borderWidths: {
                    buttonBorderWidth: "1px",
                    inputBorderWidth: "1px",
                  },
                  radii: {
                    borderRadiusButton: "6px",
                    buttonBorderRadius: "6px",
                    inputBorderRadius: "6px",
                  },
                },
              },
              className: {
                container: "w-full",
                button: "w-full px-4 py-2 text-sm font-medium rounded-md",
                input:
                  "w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500",
              },
            }}
            providers={[]}
            redirectTo="/dashboard"
          />

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Need an account? Contact your administrator.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
