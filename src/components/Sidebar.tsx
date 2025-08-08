"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Plus, BarChart3, Users, History, Wallet } from "lucide-react";
import { useEffect, useState } from "react";
import { getCurrentUser } from "@/lib/auth-utils";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import Image from "next/image";

export default function AppSidebar() {
  const pathname = usePathname();
  const [userRole, setUserRole] = useState<string | null>(null);

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
    { href: "/wallets", label: "My Wallets", icon: Wallet },
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

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center px-2 py-2">
          <Link href="/dashboard" className="flex items-center space-x-2">
            <Image
              src="/logo.webp"
              alt="SupaSpend logo"
              width={32}
              height={32}
            />
            <span className="text-xl font-bold text-primary truncate group-data-[collapsible=icon]:hidden">
              SupaSpend
            </span>
          </Link>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <div className="mb-4">
              <Link href="/expenses/new">
                <SidebarMenuButton
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 hover:text-black justify-center"
                  size="lg"
                >
                  <Plus className="size-4" />
                  <span>Add Expense</span>
                </SidebarMenuButton>
              </Link>
            </div>
            <SidebarMenu>
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.label}
                    >
                      <Link href={item.href}>
                        <Icon className="size-4" />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
