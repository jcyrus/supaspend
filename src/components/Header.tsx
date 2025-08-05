"use client";

import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import ProfileDropdown from "./ProfileDropdown";

export default function Header() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Toggle function for next-themes
  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  // Don't render theme toggle until mounted (prevents hydration mismatch)
  if (!mounted) {
    return (
      <div className="bg-background border-b px-4 lg:px-8 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Sidebar toggle placeholder */}
            <div className="h-7 w-7"></div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Placeholder for theme toggle */}
            <div className="h-9 w-9"></div>
            {/* Placeholder for profile dropdown */}
            <div className="w-32 h-10"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background border-b px-4 lg:px-8 py-3">
      <div className="w-full flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {/* Sidebar Toggle */}
          <SidebarTrigger />
        </div>

        <div className="flex items-center space-x-4">
          {/* Theme Toggle */}
          <Button
            variant="outline"
            size="icon"
            onClick={toggleTheme}
            aria-label={`Switch to ${
              theme === "light" ? "dark" : "light"
            } mode`}
          >
            {theme === "light" ? (
              <Moon className="h-4 w-4" />
            ) : (
              <Sun className="h-4 w-4" />
            )}
          </Button>

          {/* Profile Dropdown */}
          <ProfileDropdown />
        </div>
      </div>
    </div>
  );
}
