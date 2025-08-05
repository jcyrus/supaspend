"use client";

import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { useEffect, useState } from "react";
import ProfileDropdown from "./ProfileDropdown";

interface HeaderProps {
  title?: string;
  showTitle?: boolean;
  variant?: "dashboard" | "admin";
}

export default function Header({
  title,
  showTitle = false,
  variant = "dashboard",
}: HeaderProps) {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Determine title based on variant if not provided
  const displayTitle =
    title || (variant === "admin" ? "Admin Dashboard" : "Dashboard");

  // Toggle function for next-themes
  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  // Don't render theme toggle until mounted (prevents hydration mismatch)
  if (!mounted) {
    return (
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 lg:px-8 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {(showTitle || variant === "admin") && (
            <div className="flex items-center space-x-4">
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                {displayTitle}
              </h1>
            </div>
          )}

          <div className="flex items-center space-x-4 ml-auto">
            {/* Placeholder for theme toggle */}
            <div className="w-9 h-9"></div>
            {/* Placeholder for profile dropdown */}
            <div className="w-32 h-10"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 lg:px-8 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {(showTitle || variant === "admin") && (
          <div className="flex items-center space-x-4">
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
              {displayTitle}
            </h1>
          </div>
        )}

        <div className="flex items-center space-x-4 ml-auto">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
            aria-label={`Switch to ${
              theme === "light" ? "dark" : "light"
            } mode`}
          >
            {theme === "light" ? (
              <Moon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
            ) : (
              <Sun className="h-5 w-5 text-gray-600 dark:text-gray-300" />
            )}
          </button>

          {/* Profile Dropdown */}
          <ProfileDropdown />
        </div>
      </div>
    </div>
  );
}
