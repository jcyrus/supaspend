"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Plus,
  BarChart3,
  Users,
  Menu,
  X,
  ChevronDown,
  History,
} from "lucide-react";
import { useEffect, useState } from "react";
import { getCurrentUser } from "@/lib/auth-utils";
import { useSidebar } from "@/contexts/SidebarContext";
import Image from "next/image";

export default function Sidebar() {
  const pathname = usePathname();
  const [userRole, setUserRole] = useState<string | null>(null);
  const { isCollapsed, setIsCollapsed, isMobileOpen, setIsMobileOpen } =
    useSidebar();

  useEffect(() => {
    const getUser = async () => {
      const currentUser = await getCurrentUser();
      if (currentUser) {
        setUserRole(currentUser.profile?.role || null);
      }
    };

    getUser();
  }, []);

  const baseNavItems = [
    { href: "/dashboard", label: "Dashboard", icon: Home },
    { href: "/expenses/new", label: "Add Expense", icon: Plus },
    { href: "/transactions", label: "Transactions", icon: History },
    { href: "/reports", label: "Reports", icon: BarChart3 },
  ];

  const adminNavItems = [
    { href: "/admin/users", label: "Manage Users", icon: Users },
  ];

  const navItems =
    userRole && ["admin", "superadmin"].includes(userRole)
      ? [...baseNavItems, ...adminNavItems]
      : baseNavItems;

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center px-4 border-b border-gray-200 dark:border-gray-700 py-6">
        <Link href="/dashboard" className="flex items-center space-x-2">
          <Image src="/logo.webp" alt="Supaspend Logo" width={32} height={32} />
          {!isCollapsed && (
            <span className="text-xl font-bold text-primary-500 dark:text-white truncate">
              SupaSpend
            </span>
          )}
        </Link>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 px-2 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsMobileOpen(false)}
              className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 group ${
                isActive
                  ? "bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 border-r-2 border-blue-700 dark:border-blue-400"
                  : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
            >
              <Icon
                className={`flex-shrink-0 ${
                  isCollapsed ? "h-5 w-5" : "h-4 w-4 mr-3"
                }`}
              />
              {!isCollapsed && <span className="truncate">{item.label}</span>}
              {isCollapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 dark:bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                  {item.label}
                </div>
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );

  return (
    <>
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-50 dark:bg-gray-900 dark:bg-opacity-75 z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 shadow-lg transform ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        } transition-transform duration-300 ease-in-out lg:hidden`}
      >
        <div className="flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-700 py-3">
          <Link href="/dashboard" className="flex items-center space-x-2">
            <Image
              src="/logo.webp"
              alt="Petty Cash Logo"
              width={32}
              height={32}
            />
            <span className="text-xl font-bold text-gray-900 dark:text-white">
              Petty Cash
            </span>
          </Link>
          <button
            onClick={() => setIsMobileOpen(false)}
            className="p-2 rounded-md text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <SidebarContent />
      </div>

      {/* Desktop sidebar */}
      <div
        className={`hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 bg-white dark:bg-gray-800 shadow-lg transition-all duration-300 ${
          isCollapsed ? "lg:w-16" : "lg:w-64"
        }`}
      >
        <SidebarContent />

        {/* Collapse toggle */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full p-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm"
        >
          <ChevronDown
            className={`h-4 w-4 transition-transform ${
              isCollapsed ? "rotate-90" : "-rotate-90"
            }`}
          />
        </button>
      </div>

      {/* Mobile header */}
      <div className="lg:hidden bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => setIsMobileOpen(true)}
          className="p-2 rounded-md text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <Menu className="h-6 w-6" />
        </button>
        <Link href="/dashboard" className="flex items-center space-x-2">
          <Image
            src="/logo.webp"
            alt="SupaSpend Logo"
            width={32}
            height={32}
            className="h-6 w-6"
          />
          <span className="text-lg font-bold text-gray-900 dark:text-white">
            SupaSpend
          </span>
        </Link>
        <div className="w-10" /> {/* Spacer for centering */}
      </div>
    </>
  );
}
