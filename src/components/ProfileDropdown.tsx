"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { User, Settings, LogOut, ChevronDown } from "lucide-react";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { getCurrentUser } from "@/lib/auth-utils";

export default function ProfileDropdown() {
  const supabase = createClient();
  const router = useRouter();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const getUser = async () => {
      const currentUser = await getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        setUserRole(currentUser.profile?.role || null);
      }
    };

    getUser();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  if (!user) {
    return null;
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 sm:space-x-3 px-2 sm:px-3 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
      >
        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-sm font-medium text-blue-600 dark:text-blue-300">
            {user?.email?.charAt(0).toUpperCase()}
          </span>
        </div>
        <div className="hidden sm:block text-left">
          <p className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-32">
            {user?.email}
          </p>
          {userRole && ["admin", "superadmin"].includes(userRole) && (
            <p className="text-xs text-blue-600 dark:text-blue-300 capitalize">
              {userRole}
            </p>
          )}
        </div>
        <ChevronDown
          className={`h-4 w-4 text-gray-500 dark:text-gray-400 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {user?.email}
            </p>
            {userRole && ["admin", "superadmin"].includes(userRole) && (
              <p className="text-xs text-blue-600 dark:text-blue-300 capitalize">
                {userRole}
              </p>
            )}
          </div>

          <div className="py-1">
            <button
              onClick={() => {
                setIsOpen(false);
                // TODO: Navigate to profile page when implemented
                console.log("Navigate to profile");
              }}
              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
            >
              <User className="h-4 w-4 mr-3" />
              Profile
            </button>

            <button
              onClick={() => {
                setIsOpen(false);
                // TODO: Navigate to settings page when implemented
                console.log("Navigate to settings");
              }}
              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
            >
              <Settings className="h-4 w-4 mr-3" />
              Settings
            </button>

            <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>

            <button
              onClick={() => {
                setIsOpen(false);
                handleSignOut();
              }}
              className="flex items-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-200"
            >
              <LogOut className="h-4 w-4 mr-3" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
