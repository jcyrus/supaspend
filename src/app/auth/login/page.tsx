"use client";

import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function LoginPage() {
  const supabase = createClient();
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  // Toggle function for next-themes
  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
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

  // Force input text color based on current theme
  useEffect(() => {
    const addInputStyles = () => {
      const existingStyle = document.getElementById("auth-input-override");
      if (existingStyle) {
        existingStyle.remove();
      }

      const style = document.createElement("style");
      style.id = "auth-input-override";

      if (theme === "dark") {
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
      } else {
        // Light theme styles
        style.innerHTML = `
          .supabase-auth-ui_ui input[type="email"],
          .supabase-auth-ui_ui input[type="password"],
          .supabase-auth-ui_ui input[type="text"] {
            color: #1f2937 !important;
            background-color: white !important;
            border-color: #d1d5db !important;
          }
          .supabase-auth-ui_ui input[type="email"]::placeholder,
          .supabase-auth-ui_ui input[type="password"]::placeholder,
          .supabase-auth-ui_ui input[type="text"]::placeholder {
            color: #6b7280 !important;
          }
          .supabase-auth-ui_ui input[type="email"]:focus,
          .supabase-auth-ui_ui input[type="password"]:focus,
          .supabase-auth-ui_ui input[type="text"]:focus {
            color: #1f2937 !important;
            background-color: white !important;
            border-color: #3b82f6 !important;
            outline: none !important;
            box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5) !important;
          }
        `;
      }

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
  }, [theme]); // Added theme dependency

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* Theme Toggle */}
      <div className="absolute top-4 right-4">
        <Button
          variant="outline"
          size="icon"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
        >
          {theme === "light" ? (
            <Moon className="h-4 w-4" />
          ) : (
            <Sun className="h-4 w-4" />
          )}
        </Button>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Petty Cash Tracker</h1>
          <h2 className="text-xl text-muted-foreground">
            Sign in to your account
          </h2>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card>
          <CardContent className="py-8 px-4 sm:px-10">
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
                      inputText: theme === "dark" ? "#ffffff" : "#1f2937",
                      inputBackground: theme === "dark" ? "#374151" : "#ffffff",
                      inputBorder: theme === "dark" ? "#4b5563" : "#d1d5db",
                      inputPlaceholder:
                        theme === "dark" ? "#9ca3af" : "#6b7280",
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
              <p className="text-sm text-muted-foreground">
                Need an account? Contact your administrator.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
