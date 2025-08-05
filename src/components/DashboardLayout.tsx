"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import AdminHeader from "./AdminHeader";
import DashboardHeader from "./DashboardHeader";
import { getCurrentUser } from "@/lib/auth-utils";
import { useSidebar } from "@/contexts/SidebarContext";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const [userRole, setUserRole] = useState<string | null>(null);
  const { isCollapsed } = useSidebar();

  useEffect(() => {
    const getUser = async () => {
      const currentUser = await getCurrentUser();
      if (currentUser) {
        setUserRole(currentUser.profile?.role || null);
      }
    };
    getUser();
  }, []);

  // Don't show sidebar on auth pages
  const isAuthPage = pathname?.startsWith("/auth");
  const isAdminPage =
    pathname?.startsWith("/admin") ||
    userRole === "admin" ||
    userRole === "superadmin";

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />

      {/* Main content */}
      <div
        className={`transition-all duration-300 ${
          isCollapsed ? "lg:pl-16" : "lg:pl-64"
        }`}
      >
        {/* Dashboard Header - show for all dashboard pages */}
        {isAdminPage ? <AdminHeader /> : <DashboardHeader />}

        <main className="px-4 lg:px-8 py-6">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
